import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { addLine, clampQuantity, type CartLine } from "./cart-math";

const KEY = "pinkprem-cart-v1";

interface CartState {
  lines: CartLine[];
  count: number;
  add: (variantId: string, qty: number, stock: number) => void;
  setQuantity: (variantId: string, qty: number, stock: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
          setLines(
            parsed.filter(
              (l): l is CartLine => typeof l?.variantId === "string" && Number.isInteger(l?.quantity) && l.quantity > 0,
            ),
          );
      }
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback((id: string, qty: number, stock: number) => setLines((l) => addLine(l, id, qty, stock)), []);
  const setQuantity = useCallback(
    (id: string, qty: number, stock: number) =>
      setLines((l) => l.map((x) => (x.variantId === id ? { ...x, quantity: Math.max(1, clampQuantity(qty, stock)) } : x))),
    [],
  );
  const remove = useCallback((id: string) => setLines((l) => l.filter((x) => x.variantId !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  return (
    <CartContext.Provider
      value={{ lines, count: lines.reduce((s, l) => s + l.quantity, 0), add, setQuantity, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
