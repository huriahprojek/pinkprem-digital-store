ALTER TABLE public.order_items ADD COLUMN duration_days integer;
CREATE OR REPLACE FUNCTION public.snapshot_order_duration() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN SELECT duration_days INTO NEW.duration_days FROM public.product_variants WHERE id=NEW.variant_id; RETURN NEW; END $$;
CREATE TRIGGER order_item_duration BEFORE INSERT ON public.order_items FOR EACH ROW EXECUTE FUNCTION public.snapshot_order_duration();
CREATE OR REPLACE FUNCTION public.validate_order_transition() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.status IS DISTINCT FROM OLD.status AND NOT ((OLD.status='menunggu_pembayaran' AND NEW.status IN ('dibayar','dibatalkan')) OR (OLD.status='dibayar' AND NEW.status IN ('diproses','dibatalkan')) OR (OLD.status='diproses' AND NEW.status IN ('selesai','dibatalkan'))) THEN RAISE EXCEPTION 'Perubahan status tidak diizinkan'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER order_transition_guard BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.validate_order_transition();
CREATE OR REPLACE FUNCTION public.validate_catalog_fields() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF char_length(NEW.name) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Nama tidak valid'; END IF;
 IF TG_TABLE_NAME='products' THEN
 IF char_length(NEW.category)>100 OR char_length(NEW.short_description)>300 OR char_length(NEW.description)>5000 OR NEW.tile_color !~ '^#[0-9A-Fa-f]{6}$' OR char_length(coalesce(NEW.image_path,''))>300 THEN RAISE EXCEPTION 'Data produk tidak valid'; END IF;
 ELSIF TG_TABLE_NAME='product_options' THEN
 IF char_length(NEW.description)>1000 THEN RAISE EXCEPTION 'Deskripsi terlalu panjang'; END IF;
 ELSIF TG_TABLE_NAME='product_variants' THEN
 IF NEW.option_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.product_options WHERE id=NEW.option_id AND product_id=NEW.product_id) THEN RAISE EXCEPTION 'Option bukan milik produk ini'; END IF;
 END IF; RETURN NEW; END $$;
CREATE TRIGGER product_fields_guard BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.validate_catalog_fields();
CREATE TRIGGER option_fields_guard BEFORE INSERT OR UPDATE ON public.product_options FOR EACH ROW EXECUTE FUNCTION public.validate_catalog_fields();
CREATE TRIGGER variant_fields_guard BEFORE INSERT OR UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.validate_catalog_fields();
CREATE OR REPLACE FUNCTION public.validate_store_settings() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 IF NEW.store_name<>'fluffnshine' OR char_length(NEW.order_message_template) NOT BETWEEN 1 AND 4000 OR char_length(NEW.restock_message_template) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Pengaturan tidak valid'; END IF;
 IF NEW.whatsapp_configured AND (NEW.admin_whatsapp !~ '^62[0-9]{8,13}$' OR NEW.admin_whatsapp='6280000000000') THEN RAISE EXCEPTION 'Nomor WhatsApp admin belum valid'; END IF;
 RETURN NEW; END $$;
CREATE TRIGGER settings_guard BEFORE UPDATE ON public.store_settings FOR EACH ROW EXECUTE FUNCTION public.validate_store_settings();
ALTER TABLE public.store_settings ALTER COLUMN store_name SET DEFAULT 'fluffnshine';
CREATE OR REPLACE FUNCTION public.place_order(_items jsonb, _customer_name text, _customer_whatsapp text, _customer_email text, _note text DEFAULT '') RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _uid uuid:=auth.uid(); _order_id uuid; _code text; _item jsonb; _qty integer; _v record; _subtotal numeric:=0; _item_id uuid;
BEGIN
 IF _uid IS NULL THEN RAISE EXCEPTION 'Silakan masuk terlebih dahulu' USING ERRCODE='42501'; END IF;
 IF _items IS NULL OR jsonb_typeof(_items)<>'array' THEN RAISE EXCEPTION 'Keranjang tidak valid'; END IF;
 IF jsonb_array_length(_items) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Keranjang kosong atau terlalu banyak item'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(_items))<>(SELECT count(DISTINCT value->>'variant_id') FROM jsonb_array_elements(_items)) THEN RAISE EXCEPTION 'Paket duplikat tidak diizinkan'; END IF;
 _customer_name:=btrim(coalesce(_customer_name,'')); _customer_email:=btrim(coalesce(_customer_email,'')); _customer_whatsapp:=regexp_replace(coalesce(_customer_whatsapp,''),'[^0-9]','','g');
 IF char_length(_customer_name) NOT BETWEEN 2 AND 100 OR _customer_whatsapp !~ '^[0-9]{9,16}$' OR _customer_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(_customer_email)>255 OR char_length(coalesce(_note,''))>500 THEN RAISE EXCEPTION 'Data pelanggan tidak valid'; END IF;
 _code:='FS-'||to_char(now() AT TIME ZONE 'Asia/Jakarta','YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
 INSERT INTO public.orders(order_code,user_id,customer_name,customer_whatsapp,customer_email,note,subtotal,total) VALUES(_code,_uid,_customer_name,_customer_whatsapp,_customer_email,btrim(coalesce(_note,'')),0,0) RETURNING id INTO _order_id;
 FOR _item IN SELECT value FROM jsonb_array_elements(_items) ORDER BY value->>'variant_id' LOOP
 IF jsonb_typeof(_item)<>'object' OR (_item->>'quantity') IS NULL OR (_item->>'quantity') !~ '^[0-9]+$' OR (_item->>'variant_id') IS NULL THEN RAISE EXCEPTION 'Item tidak valid'; END IF;
 _qty:=(_item->>'quantity')::int; IF _qty NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Jumlah tidak valid'; END IF;
 UPDATE public.product_variants v SET stock=stock-_qty WHERE v.id=(_item->>'variant_id')::uuid AND v.is_active AND v.stock>=_qty AND EXISTS(SELECT 1 FROM public.products p WHERE p.id=v.product_id AND p.is_active) AND (v.option_id IS NULL OR EXISTS(SELECT 1 FROM public.product_options o WHERE o.id=v.option_id AND o.product_id=v.product_id AND o.is_active)) RETURNING v.* INTO _v;
 IF NOT FOUND THEN RAISE EXCEPTION 'Stok tidak mencukupi atau paket tidak aktif. Perbarui keranjang.'; END IF;
 INSERT INTO public.order_items(order_id,product_id,variant_id,product_name,option_name,variant_name,unit_price,quantity,line_total) VALUES(_order_id,_v.product_id,_v.id,(SELECT name FROM public.products WHERE id=_v.product_id),(SELECT name FROM public.product_options WHERE id=_v.option_id),_v.name,_v.price,_qty,_v.price*_qty) RETURNING id INTO _item_id;
 INSERT INTO public.order_item_costs(order_item_id,unit_cost) VALUES(_item_id,coalesce((SELECT cost_price FROM public.variant_costs WHERE variant_id=_v.id),0));
 INSERT INTO public.inventory_adjustments(variant_id,delta,reason,order_id,created_by) VALUES(_v.id,-_qty,'order_reserved',_order_id,_uid);
 _subtotal:=_subtotal+_v.price*_qty;
 END LOOP;
 UPDATE public.orders SET subtotal=_subtotal,total=_subtotal WHERE id=_order_id;
 INSERT INTO public.order_status_history(order_id,to_status,changed_by,note) VALUES(_order_id,'menunggu_pembayaran',_uid,'Pesanan dibuat');
 RETURN jsonb_build_object('order_id',_order_id,'order_code',_code,'total',_subtotal);
END $$;
CREATE OR REPLACE FUNCTION public.admin_save_variant(_data jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid; _old integer;
BEGIN
 IF NOT public.has_role(auth.uid(),'admin') THEN RAISE EXCEPTION 'Akses ditolak' USING ERRCODE='42501'; END IF;
 _id:=coalesce(nullif(_data->>'id','')::uuid,gen_random_uuid());
 SELECT stock INTO _old FROM public.product_variants WHERE id=_id FOR UPDATE;
 INSERT INTO public.product_variants(id,product_id,option_id,name,duration_days,price,stock,is_active,sort_order) VALUES(_id,(_data->>'product_id')::uuid,nullif(_data->>'option_id','')::uuid,_data->>'name',nullif(_data->>'duration_days','')::int,(_data->>'price')::numeric,(_data->>'stock')::int,(_data->>'is_active')::boolean,(_data->>'sort_order')::int)
 ON CONFLICT(id) DO UPDATE SET option_id=excluded.option_id,name=excluded.name,duration_days=excluded.duration_days,price=excluded.price,stock=excluded.stock,is_active=excluded.is_active,sort_order=excluded.sort_order;
 INSERT INTO public.variant_costs(variant_id,cost_price) VALUES(_id,(_data->>'cost_price')::numeric) ON CONFLICT(variant_id) DO UPDATE SET cost_price=excluded.cost_price,updated_at=now();
 IF coalesce(_old,0)<>(_data->>'stock')::int THEN INSERT INTO public.inventory_adjustments(variant_id,delta,reason,created_by) VALUES(_id,(_data->>'stock')::int-coalesce(_old,0),'admin_catalog_update',auth.uid()); END IF;
 RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.admin_save_variant(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.admin_save_variant(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid,public.app_role) TO anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.snapshot_order_duration() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_transition() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_catalog_fields() FROM PUBLIC,anon,authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_store_settings() FROM PUBLIC,anon,authenticated;