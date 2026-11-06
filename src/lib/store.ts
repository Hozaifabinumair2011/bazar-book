import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  SEED_PRODUCTS,
  SEED_RETAILERS,
  type Order,
  type OrderLine,
  type Product,
  type Retailer,
  uid,
} from "@/lib/book";

export type NewOrder = {
  id?: string;
  date: string;
  retailer: Retailer;
  note: string;
  lines: OrderLine[];
};

type BookState = {
  products: Product[];
  retailers: Retailer[];
  orders: Order[];
  visits: Record<string, number>;
  hintDismissed: boolean;
  dismissHint: () => void;
  saveProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  saveRetailer: (retailer: Retailer) => void;
  deleteRetailer: (id: string) => void;
  saveOrder: (input: NewOrder) => string;
  deleteOrder: (id: string) => void;
  setVisits: (date: string, count: number) => void;
};

function shopCount(orders: Order[], date: string): number {
  return new Set(orders.filter((o) => o.date === date).map((o) => o.retailerId)).size;
}

export const useBook = create<BookState>()(
  persist(
    (set) => ({
      products: SEED_PRODUCTS,
      retailers: SEED_RETAILERS,
      orders: [],
      visits: {},
      hintDismissed: false,
      dismissHint: () => set({ hintDismissed: true }),
      saveProduct: (product) =>
        set((state) => {
          const exists = state.products.some((p) => p.id === product.id);
          return {
            products: exists
              ? state.products.map((p) => (p.id === product.id ? product : p))
              : [...state.products, product],
          };
        }),
      deleteProduct: (id) => set((state) => ({ products: state.products.filter((p) => p.id !== id) })),
      saveRetailer: (retailer) =>
        set((state) => {
          const exists = state.retailers.some((r) => r.id === retailer.id);
          return {
            retailers: exists
              ? state.retailers.map((r) => (r.id === retailer.id ? retailer : r))
              : [...state.retailers, retailer],
          };
        }),
      deleteRetailer: (id) => set((state) => ({ retailers: state.retailers.filter((r) => r.id !== id) })),
      saveOrder: (input) => {
        const id = input.id ?? uid();
        const createdAt = new Date().toISOString();
        set((state) => {
          const retailerExists = state.retailers.some((r) => r.id === input.retailer.id);
          const retailers = retailerExists
            ? state.retailers.map((r) => (r.id === input.retailer.id ? input.retailer : r))
            : [...state.retailers, input.retailer];
          const previous = state.orders.find((o) => o.id === id);
          const order: Order = {
            id,
            date: input.date,
            createdAt: previous?.createdAt ?? createdAt,
            retailerId: input.retailer.id,
            retailerName: input.retailer.name.trim(),
            shopType: input.retailer.shopType,
            address: input.retailer.address.trim(),
            phone: input.retailer.phone.trim(),
            note: input.note.trim(),
            lines: input.lines.filter((line) => line.qty > 0),
          };
          const orders = previous ? state.orders.map((o) => (o.id === id ? order : o)) : [...state.orders, order];
          const visits = { ...state.visits };
          visits[order.date] = Math.max(visits[order.date] ?? 0, shopCount(orders, order.date));
          if (previous && previous.date !== order.date) {
            visits[previous.date] = Math.max(visits[previous.date] ?? 0, shopCount(orders, previous.date));
          }
          return { retailers, orders, visits };
        });
        return id;
      },
      deleteOrder: (id) =>
        set((state) => {
          const target = state.orders.find((o) => o.id === id);
          const orders = state.orders.filter((o) => o.id !== id);
          if (!target) return { orders };
          const visits = { ...state.visits };
          visits[target.date] = Math.max(visits[target.date] ?? 0, shopCount(orders, target.date));
          return { orders, visits };
        }),
      setVisits: (date, count) =>
        set((state) => ({
          visits: {
            ...state.visits,
            [date]: Math.max(0, Math.floor(count), shopCount(state.orders, date)),
          },
        })),
    }),
    { name: "bazaar-book-v2" },
  ),
);
