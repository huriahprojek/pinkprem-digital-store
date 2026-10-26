export interface CartLine {
  variantId: string;
  quantity: number;
}

export interface PricedLine extends CartLine {
  price: number;
  stock: number;
}

/** Clamp a requested quantity to [1, stock]; returns 0 when stock is empty. */
export function clampQuantity(requested: number, stock: number): number {
  if (stock <= 0) return 0;
  const q = Math.floor(Number.isFinite(requested) ? requested : 1);
  return Math.max(1, Math.min(q, stock));
}

export function lineTotal(line: { price: number; quantity: number }): number {
  return Math.round(line.price * line.quantity);
}

export function cartSubtotal(lines: { price: number; quantity: number }[]): number {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

/** Merge an add-to-cart into existing lines without exceeding stock. */
export function addLine(lines: CartLine[], variantId: string, qty: number, stock: number): CartLine[] {
  const existing = lines.find((l) => l.variantId === variantId);
  const next = clampQuantity((existing?.quantity ?? 0) + qty, stock);
  if (next === 0) return lines;
  if (existing) return lines.map((l) => (l.variantId === variantId ? { ...l, quantity: next } : l));
  return [...lines, { variantId, quantity: next }];
}
