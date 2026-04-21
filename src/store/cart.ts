import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine, Product } from "@/types/shop";

interface CartState {
  lines: CartLine[];
  add: (product: Product) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  totalQty: () => number;
  totalTHB: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (product) =>
        set((state) => {
          const existing = state.lines.find((l) => l.product.id === product.id);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.product.id === product.id ? { ...l, qty: Math.min(l.qty + 1, product.inStock) } : l
              ),
            };
          }
          return { lines: [...state.lines, { product, qty: 1 }] };
        }),
      remove: (productId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.product.id !== productId) })),
      setQty: (productId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.product.id !== productId)
              : state.lines.map((l) =>
                  l.product.id === productId
                    ? { ...l, qty: Math.min(qty, l.product.inStock) }
                    : l
                ),
        })),
      clear: () => set({ lines: [] }),
      totalQty: () => get().lines.reduce((s, l) => s + l.qty, 0),
      totalTHB: () => get().lines.reduce((s, l) => s + l.qty * l.product.priceTHB, 0),
    }),
    { name: "sweetleaf-cart" }
  )
);
