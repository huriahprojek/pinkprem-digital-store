import { rupiah } from "./format";

/** Normalize Indonesian numbers to wa.me format: 08xx -> 628xx, strips symbols. */
export function normalizePhone(raw: string): string {
  let d = (raw || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d;
}

export function waLink(phone: string, text: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

export interface OrderMessageItem {
  product_name: string;
  option_name: string | null;
  variant_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export function buildOrderMessage(
  template: string,
  o: {
    store: string;
    order_code: string;
    name: string;
    whatsapp: string;
    email: string;
    note: string;
    total: number;
    items: OrderMessageItem[];
  },
): string {
  const items = o.items
    .map(
      (it, i) =>
        `${i + 1}. ${it.product_name}${it.option_name ? ` (${it.option_name})` : ""} - ${it.variant_name}\n   ${it.quantity} x ${rupiah(it.unit_price)} = ${rupiah(it.line_total)}`,
    )
    .join("\n");
  return fillTemplate(template, {
    store: o.store,
    order_code: o.order_code,
    name: o.name,
    whatsapp: o.whatsapp,
    email: o.email,
    note: o.note || "-",
    total: rupiah(o.total),
    items,
  });
}
