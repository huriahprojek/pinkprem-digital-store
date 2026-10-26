import { describe, expect, it } from "vitest";
import { addLine, cartSubtotal, clampQuantity } from "@/lib/cart-math";
import { buildOrderMessage, normalizePhone, waLink } from "@/lib/whatsapp";

describe("cart rules", () => {
  it("never exceeds available stock", () => {
    expect(clampQuantity(10, 3)).toBe(3);
    expect(addLine([{ variantId: "a", quantity: 2 }], "a", 5, 4)).toEqual([{ variantId: "a", quantity: 4 }]);
  });
  it("out-of-stock variants cannot be added", () => {
    expect(addLine([], "a", 1, 0)).toEqual([]);
  });
  it("subtotal sums price x quantity", () => {
    expect(cartSubtotal([{ price: 35000, quantity: 2 }, { price: 15000, quantity: 1 }])).toBe(85000);
  });
});

describe("whatsapp", () => {
  it("normalizes 08 numbers to 62", () => {
    expect(normalizePhone("0812-3456-789")).toBe("628123456789");
  });
  it("builds an encoded order message with code and total", () => {
    const msg = buildOrderMessage("Kode {order_code} total {total}\n{items}", {
      store: "PinkPrem", order_code: "PP-1", name: "A", whatsapp: "08", email: "a@b.c", note: "",
      total: 70000,
      items: [{ product_name: "Netflix", option_name: "Sharing", variant_name: "1 Bulan", quantity: 2, unit_price: 35000, line_total: 70000 }],
    });
    expect(msg).toContain("PP-1");
    expect(msg).toContain("Netflix (Sharing) - 1 Bulan");
    expect(waLink("0811", msg)).toContain("https://wa.me/62811?text=Kode%20PP-1");
  });
});
