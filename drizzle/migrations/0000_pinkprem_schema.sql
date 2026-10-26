
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('menunggu_pembayaran','dibayar','diproses','selesai','dibatalkan');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '' CHECK (char_length(full_name) <= 100),
  email text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '' CHECK (char_length(whatsapp) <= 20),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, whatsapp, updated_at) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, whatsapp)
  VALUES (NEW.id,
          left(coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), 100),
          coalesce(NEW.email, ''),
          left(coalesce(NEW.raw_user_meta_data->>'whatsapp', ''), 20));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  category text NOT NULL DEFAULT 'Lainnya',
  short_description text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  tile_color text NOT NULL DEFAULT '#F47B9B',
  image_path text,
  is_active boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX products_active_idx ON public.products (is_active, sort_order);
CREATE INDEX products_category_idx ON public.products (category);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active products" ON public.products FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage products" ON public.products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER products_touch BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.product_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  description text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_options_product_idx ON public.product_options (product_id, sort_order);
GRANT SELECT ON public.product_options TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_options TO authenticated;
GRANT ALL ON public.product_options TO service_role;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active options" ON public.product_options FOR SELECT TO anon, authenticated
  USING ((is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active))
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage options" ON public.product_options FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  option_id uuid REFERENCES public.product_options(id) ON DELETE SET NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  duration_days int CHECK (duration_days IS NULL OR duration_days > 0),
  price numeric(12,2) NOT NULL CHECK (price >= 0),
  stock int NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX product_variants_product_idx ON public.product_variants (product_id, sort_order);
CREATE INDEX product_variants_option_idx ON public.product_variants (option_id);
GRANT SELECT ON public.product_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_variants TO authenticated;
GRANT ALL ON public.product_variants TO service_role;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active variants" ON public.product_variants FOR SELECT TO anon, authenticated
  USING ((is_active AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.is_active))
         OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage variants" ON public.product_variants FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER variants_touch BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.variant_costs (
  variant_id uuid PRIMARY KEY REFERENCES public.product_variants(id) ON DELETE CASCADE,
  cost_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.variant_costs TO authenticated;
GRANT ALL ON public.variant_costs TO service_role;
ALTER TABLE public.variant_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin only costs" ON public.variant_costs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_whatsapp text NOT NULL,
  customer_email text NOT NULL,
  note text NOT NULL DEFAULT '',
  status public.order_status NOT NULL DEFAULT 'menunggu_pembayaran',
  subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
  total numeric(12,2) NOT NULL CHECK (total >= 0),
  payment_method text NOT NULL DEFAULT 'manual_whatsapp',
  payment_reference text,
  stock_released boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders (user_id, created_at DESC);
CREATE INDEX orders_status_idx ON public.orders (status, created_at DESC);
CREATE INDEX orders_created_idx ON public.orders (created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin orders" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  option_name text,
  variant_name text NOT NULL,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  quantity int NOT NULL CHECK (quantity > 0),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_items_order_idx ON public.order_items (order_id);
CREATE INDEX order_items_product_idx ON public.order_items (product_id);
GRANT SELECT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin items" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
                 AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.order_item_costs (
  order_item_id uuid PRIMARY KEY REFERENCES public.order_items(id) ON DELETE CASCADE,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0
);
GRANT SELECT ON public.order_item_costs TO authenticated;
GRANT ALL ON public.order_item_costs TO service_role;
ALTER TABLE public.order_item_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin item costs" ON public.order_item_costs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status public.order_status,
  to_status public.order_status NOT NULL,
  changed_by uuid,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_status_history_order_idx ON public.order_status_history (order_id, created_at);
GRANT SELECT ON public.order_status_history TO authenticated;
GRANT ALL ON public.order_status_history TO service_role;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or admin history" ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id
                 AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  delta int NOT NULL,
  reason text NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX inventory_adjustments_variant_idx ON public.inventory_adjustments (variant_id, created_at DESC);
GRANT SELECT ON public.inventory_adjustments TO authenticated;
GRANT ALL ON public.inventory_adjustments TO service_role;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read adjustments" ON public.inventory_adjustments FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.store_settings (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  store_name text NOT NULL DEFAULT 'PinkPrem',
  admin_whatsapp text NOT NULL DEFAULT '6280000000000',
  whatsapp_configured boolean NOT NULL DEFAULT false,
  order_message_template text NOT NULL,
  restock_message_template text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_settings TO anon;
GRANT SELECT, UPDATE ON public.store_settings TO authenticated;
GRANT ALL ON public.store_settings TO service_role;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admin update settings" ON public.store_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER settings_touch BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.store_settings (id, order_message_template, restock_message_template) VALUES (1,
E'Halo Admin {store}, saya ingin konfirmasi pesanan.\n\nKode Pesanan: *{order_code}*\nNama: {name}\nWhatsApp: {whatsapp}\nEmail: {email}\n\nDetail Pesanan:\n{items}\n\nTotal: *{total}*\nCatatan: {note}\n\nMohon info cara pembayarannya. Terima kasih!',
E'Halo Admin {store}, saya ingin menanyakan restock untuk *{product}* ({variant}). Terima kasih!');

CREATE OR REPLACE FUNCTION public.place_order(
  _items jsonb, _customer_name text, _customer_whatsapp text, _customer_email text, _note text DEFAULT ''
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _order_id uuid;
  _code text;
  _item jsonb;
  _qty int;
  _v record;
  _subtotal numeric(12,2) := 0;
  _item_id uuid;
  _tries int := 0;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Silakan masuk terlebih dahulu' USING ERRCODE = '42501'; END IF;
  IF _items IS NULL OR jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Keranjang kosong'; END IF;
  IF jsonb_array_length(_items) > 50 THEN RAISE EXCEPTION 'Terlalu banyak item'; END IF;
  _customer_name := btrim(coalesce(_customer_name, ''));
  _customer_whatsapp := regexp_replace(coalesce(_customer_whatsapp, ''), '[^0-9+]', '', 'g');
  _customer_email := btrim(coalesce(_customer_email, ''));
  _note := left(btrim(coalesce(_note, '')), 500);
  IF char_length(_customer_name) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Nama tidak valid'; END IF;
  IF char_length(_customer_whatsapp) NOT BETWEEN 9 AND 16 THEN RAISE EXCEPTION 'Nomor WhatsApp tidak valid'; END IF;
  IF _customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(_customer_email) > 255 THEN
    RAISE EXCEPTION 'Email tidak valid'; END IF;

  LOOP
    _code := 'PP-' || to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD') || '-' ||
             upper(substr(md5(random()::text || clock_timestamp()::text), 1, 5));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_code = _code);
    _tries := _tries + 1;
    IF _tries > 10 THEN RAISE EXCEPTION 'Gagal membuat kode pesanan'; END IF;
  END LOOP;

  INSERT INTO public.orders (order_code, user_id, customer_name, customer_whatsapp, customer_email, note, subtotal, total)
  VALUES (_code, _uid, _customer_name, _customer_whatsapp, _customer_email, _note, 0, 0)
  RETURNING id INTO _order_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := (_item->>'quantity')::int;
    IF _qty IS NULL OR _qty < 1 OR _qty > 100 THEN RAISE EXCEPTION 'Jumlah tidak valid'; END IF;

    UPDATE public.product_variants v SET stock = v.stock - _qty
    WHERE v.id = (_item->>'variant_id')::uuid AND v.is_active AND v.stock >= _qty
      AND EXISTS (SELECT 1 FROM public.products p WHERE p.id = v.product_id AND p.is_active)
    RETURNING v.id, v.product_id, v.option_id, v.name, v.price INTO _v;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stok tidak mencukupi untuk salah satu paket. Silakan perbarui keranjang.';
    END IF;

    INSERT INTO public.order_items (order_id, product_id, variant_id, product_name, option_name, variant_name, unit_price, quantity, line_total)
    VALUES (_order_id, _v.product_id, _v.id,
            (SELECT name FROM public.products WHERE id = _v.product_id),
            (SELECT name FROM public.product_options WHERE id = _v.option_id),
            _v.name, _v.price, _qty, _v.price * _qty)
    RETURNING id INTO _item_id;

    INSERT INTO public.order_item_costs (order_item_id, unit_cost)
    VALUES (_item_id, coalesce((SELECT cost_price FROM public.variant_costs WHERE variant_id = _v.id), 0));

    INSERT INTO public.inventory_adjustments (variant_id, delta, reason, order_id, created_by)
    VALUES (_v.id, -_qty, 'order_reserved', _order_id, _uid);

    _subtotal := _subtotal + _v.price * _qty;
  END LOOP;

  UPDATE public.orders SET subtotal = _subtotal, total = _subtotal WHERE id = _order_id;
  INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
  VALUES (_order_id, NULL, 'menunggu_pembayaran', _uid, 'Pesanan dibuat');

  RETURN jsonb_build_object('order_id', _order_id, 'order_code', _code, 'total', _subtotal);
END $$;

CREATE OR REPLACE FUNCTION public.admin_update_order_status(_order_id uuid, _status public.order_status, _note text DEFAULT '')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _o record; _it record;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  SELECT * INTO _o FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pesanan tidak ditemukan'; END IF;
  IF _o.status = _status THEN RETURN; END IF;
  IF _o.status IN ('selesai', 'dibatalkan') THEN
    RAISE EXCEPTION 'Pesanan berstatus final dan tidak dapat diubah'; END IF;

  IF _status = 'dibatalkan' AND NOT _o.stock_released THEN
    FOR _it IN SELECT variant_id, quantity FROM public.order_items WHERE order_id = _order_id AND variant_id IS NOT NULL LOOP
      UPDATE public.product_variants SET stock = stock + _it.quantity WHERE id = _it.variant_id;
      INSERT INTO public.inventory_adjustments (variant_id, delta, reason, order_id, created_by)
      VALUES (_it.variant_id, _it.quantity, 'order_cancelled_restore', _order_id, auth.uid());
    END LOOP;
    UPDATE public.orders SET stock_released = true WHERE id = _order_id;
  END IF;

  UPDATE public.orders SET status = _status WHERE id = _order_id;
  INSERT INTO public.order_status_history (order_id, from_status, to_status, changed_by, note)
  VALUES (_order_id, _o.status, _status, auth.uid(), left(coalesce(_note, ''), 500));
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_stock(_variant_id uuid, _stock int, _reason text DEFAULT 'manual')
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _old int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF _stock < 0 THEN RAISE EXCEPTION 'Stok tidak boleh negatif'; END IF;
  SELECT stock INTO _old FROM public.product_variants WHERE id = _variant_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Varian tidak ditemukan'; END IF;
  IF _old = _stock THEN RETURN; END IF;
  UPDATE public.product_variants SET stock = _stock WHERE id = _variant_id;
  INSERT INTO public.inventory_adjustments (variant_id, delta, reason, created_by)
  VALUES (_variant_id, _stock - _old, left(coalesce(nullif(_reason,''), 'manual'), 200), auth.uid());
END $$;

CREATE OR REPLACE FUNCTION public.admin_set_role(_user_id uuid, _make_admin boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  IF _make_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    IF _user_id = auth.uid() THEN RAISE EXCEPTION 'Tidak dapat mencabut peran admin Anda sendiri'; END IF;
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Silakan masuk'; END IF;
  PERFORM pg_advisory_xact_lock(424242);
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin') ON CONFLICT DO NOTHING;
  RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.admin_exists()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;

CREATE OR REPLACE FUNCTION public.admin_report(_from timestamptz, _to timestamptz)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _r jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE = '42501'; END IF;
  WITH paid AS (
    SELECT * FROM public.orders WHERE created_at >= _from AND created_at < _to
      AND status IN ('dibayar','diproses','selesai')
  ), items AS (
    SELECT oi.*, coalesce(c.unit_cost, 0) AS unit_cost FROM public.order_items oi
    JOIN paid ON paid.id = oi.order_id
    LEFT JOIN public.order_item_costs c ON c.order_item_id = oi.id
  )
  SELECT jsonb_build_object(
    'gross_sales', coalesce((SELECT sum(total) FROM paid), 0),
    'orders', (SELECT count(*) FROM paid),
    'units', coalesce((SELECT sum(quantity) FROM items), 0),
    'cost', coalesce((SELECT sum(unit_cost * quantity) FROM items), 0),
    'profit', coalesce((SELECT sum(line_total - unit_cost * quantity) FROM items), 0),
    'pending_orders', (SELECT count(*) FROM public.orders WHERE created_at >= _from AND created_at < _to AND status = 'menunggu_pembayaran'),
    'pending_value', coalesce((SELECT sum(total) FROM public.orders WHERE created_at >= _from AND created_at < _to AND status = 'menunggu_pembayaran'), 0),
    'cancelled_orders', (SELECT count(*) FROM public.orders WHERE created_at >= _from AND created_at < _to AND status = 'dibatalkan'),
    'top_products', coalesce((SELECT jsonb_agg(t) FROM (
        SELECT product_name, sum(quantity) AS units, sum(line_total) AS revenue,
               sum(line_total - unit_cost * quantity) AS profit
        FROM items GROUP BY product_name ORDER BY sum(quantity) DESC, sum(line_total) DESC LIMIT 5) t), '[]'::jsonb)
  ) INTO _r;
  RETURN _r;
END $$;

REVOKE EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_order_status(uuid, public.order_status, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_stock(uuid, int, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_role(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_first_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_report(timestamptz, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_exists() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_order_status(uuid, public.order_status, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_stock(uuid, int, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_report(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;

-- Private bucket; anyone may read (signed URLs) product images, only admins write.
CREATE POLICY "read product images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');
CREATE POLICY "admin upload product images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update product images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete product images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DO $$
DECLARE
  _p uuid; _o uuid; _v uuid;
  _cat jsonb := '[
    {"slug":"netflix","name":"Netflix","cat":"Streaming","color":"#E85D75","desc":"Nonton film & series favorit tanpa batas.",
     "opts":[{"n":"Sharing 1P1U","vars":[["1 Bulan",30,35000,22000,12],["3 Bulan",90,99000,63000,5]]},
             {"n":"Private 1 Akun","vars":[["1 Bulan",30,150000,120000,3]]}]},
    {"slug":"canva-premium","name":"Canva Premium","cat":"Desain","color":"#F47B9B","desc":"Akses template & fitur Pro untuk desain cepat.",
     "opts":[{"n":"Invite Email","vars":[["1 Bulan",30,15000,5000,30],["1 Tahun",365,85000,40000,10]]}]},
    {"slug":"hbo-max","name":"HBO Max","cat":"Streaming","color":"#B565A7","desc":"Serial & film premium pilihan.",
     "opts":[{"n":"Sharing","vars":[["1 Bulan",30,30000,18000,8]]},{"n":"Private","vars":[["1 Bulan",30,85000,65000,0]]}]},
    {"slug":"capcut-pro","name":"CapCut Pro","cat":"Editing","color":"#E56B8A","desc":"Edit video lebih mudah dengan fitur Pro.",
     "opts":[{"n":"Private Akun","vars":[["7 Hari",7,10000,4000,20],["1 Bulan",30,30000,15000,15]]}]},
    {"slug":"spotify","name":"Spotify","cat":"Musik","color":"#F28AA5","desc":"Dengar musik tanpa iklan, bisa offline.",
     "opts":[{"n":"Individual Invite","vars":[["1 Bulan",30,25000,15000,20],["3 Bulan",90,70000,42000,6]]}]},
    {"slug":"prime-video","name":"Prime Video","cat":"Streaming","color":"#D9779B","desc":"Film & original series eksklusif.",
     "opts":[{"n":"Sharing","vars":[["1 Bulan",30,20000,11000,10]]}]},
    {"slug":"vidio","name":"Vidio","cat":"Streaming","color":"#EF8FA8","desc":"Tayangan lokal, olahraga & series Indonesia.",
     "opts":[{"n":"Platinum Sharing","vars":[["1 Hari",1,5000,2000,25],["1 Bulan",30,30000,18000,10]]}]},
    {"slug":"chatgpt","name":"ChatGPT","cat":"AI","color":"#C86B85","desc":"Asisten AI untuk kerja, belajar & kreatif.",
     "opts":[{"n":"Sharing 4P","vars":[["1 Bulan",30,65000,40000,8]]},{"n":"Private","vars":[["1 Bulan",30,250000,210000,2]]}]},
    {"slug":"claude-ai","name":"Claude AI","cat":"AI","color":"#E0809A","desc":"AI untuk menulis, analisis & coding.",
     "opts":[{"n":"Private","vars":[["1 Bulan",30,260000,220000,2]]}]},
    {"slug":"youtube","name":"YouTube","cat":"Streaming","color":"#F06A8A","desc":"YouTube tanpa iklan + YouTube Music.",
     "opts":[{"n":"Family Invite","vars":[["1 Bulan",30,20000,9000,15],["3 Bulan",90,55000,27000,0]]}]}
  ]';
  _prod jsonb; _opt jsonb; _var jsonb; _i int := 0; _j int; _k int;
BEGIN
  FOR _prod IN SELECT * FROM jsonb_array_elements(_cat) LOOP
    _i := _i + 1;
    INSERT INTO public.products (slug, name, category, short_description, description, tile_color, is_demo, sort_order)
    VALUES (_prod->>'slug', _prod->>'name', _prod->>'cat', _prod->>'desc',
            (_prod->>'desc') || ' Akun dikirim manual oleh admin via WhatsApp setelah pembayaran dikonfirmasi.',
            _prod->>'color', true, _i)
    RETURNING id INTO _p;
    _j := 0;
    FOR _opt IN SELECT * FROM jsonb_array_elements(_prod->'opts') LOOP
      _j := _j + 1;
      INSERT INTO public.product_options (product_id, name, sort_order) VALUES (_p, _opt->>'n', _j) RETURNING id INTO _o;
      _k := 0;
      FOR _var IN SELECT * FROM jsonb_array_elements(_opt->'vars') LOOP
        _k := _k + 1;
        INSERT INTO public.product_variants (product_id, option_id, name, duration_days, price, stock, sort_order)
        VALUES (_p, _o, _var->>0, (_var->>1)::int, (_var->>2)::numeric, (_var->>4)::int, _k)
        RETURNING id INTO _v;
        INSERT INTO public.variant_costs (variant_id, cost_price) VALUES (_v, (_var->>3)::numeric);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;
