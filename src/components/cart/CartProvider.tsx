"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";
import { CART_STORAGE_KEY, clampQuantity, parseStoredCart, type CartItem } from "@/lib/cart";

export type { CartItem };

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const STORAGE_KEY = CART_STORAGE_KEY;

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCart(): CartItem[] {
  try {
    return parseStoredCart(window.localStorage.getItem(STORAGE_KEY));
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
      const existing = current.find((i) => i.key === item.key);
      if (existing) {
        return current.map((i) => (i.key === item.key ? { ...i, ...item, quantity: clampQuantity(i.quantity + quantity) } : i));
      }
      return [...current, { ...item, quantity: clampQuantity(quantity) }];
    });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) => current.map((i) => (i.key === key ? { ...i, quantity: clampQuantity(quantity) } : i)));
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((current) => current.filter((i) => i.key !== key));
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
