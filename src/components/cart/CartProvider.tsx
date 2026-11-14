"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  slug: string;
  name: string;
  size: string;
  image?: string;
  pricePKR: number;
  priceUSD: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  removeItem: (slug: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "exo_zilton_cart";
const MAX_QTY = 99;

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// In-memory copy of the cart, mirrored to localStorage so it survives reloads.
// Kept in memory too so the cart still works when storage is unavailable.
let memoryCart: CartItem[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): CartItem[] {
  if (memoryCart === null) {
    memoryCart = readStoredCart();
  }
  return memoryCart;
}

function getServerSnapshot(): null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      memoryCart = readStoredCart();
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function setItems(update: (current: CartItem[]) => CartItem[]) {
  memoryCart = update(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCart));
  } catch {
    // Storage unavailable (private mode); cart still works for this visit.
  }
  listeners.forEach((listener) => listener());
}

const EMPTY: CartItem[] = [];

export function CartProvider({ children }: { children: React.ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = snapshot !== null;
  const items = snapshot ?? EMPTY;

  const addItem = useCallback<CartContextValue["addItem"]>((item, quantity) => {
    setItems((current) => {
      const existing = current.find((i) => i.slug === item.slug);
      if (existing) {
        return current.map((i) =>
          i.slug === item.slug ? { ...i, ...item, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i,
        );
      }
      return [...current, { ...item, quantity: Math.min(MAX_QTY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((slug: string, quantity: number) => {
    setItems((current) =>
      current.map((i) =>
        i.slug === slug ? { ...i, quantity: Math.max(1, Math.min(MAX_QTY, quantity)) } : i,
      ),
    );
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((current) => current.filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems(() => []), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      ready,
      addItem,
      setQuantity,
      removeItem,
      clear,
    }),
    [items, ready, addItem, setQuantity, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
