// Cart shape and storage parsing, shared by the cart provider. Client-safe.

export type CartItem = {
  /** Variant key from the catalog (variant id, or a synthetic key for rows without variants). */
  key: string;
  href: string;
  name: string;
  variantTitle: string;
  sku: string;
  image?: string;
  pricePKR: number;
  priceUSD: number;
  quantity: number;
};

// v2 carts are keyed by variant; v1 carts (keyed by per-size slug) are dropped.
export const CART_STORAGE_KEY = "exo_zilton_cart_v2";
export const MAX_CART_QTY = 99;

function isCartItem(value: unknown): value is CartItem {
  const v = value as Partial<CartItem> | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.key === "string" &&
    typeof v.href === "string" &&
    typeof v.name === "string" &&
    typeof v.sku === "string" &&
    typeof v.pricePKR === "number" &&
    typeof v.priceUSD === "number" &&
    typeof v.quantity === "number"
  );
}

export function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_CART_QTY, Math.floor(quantity) || 1));
}

export function parseStoredCart(raw: string | null): CartItem[] {
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const merged = new Map<string, CartItem>();
  for (const entry of parsed.filter(isCartItem)) {
    const existing = merged.get(entry.key);
    const quantity = clampQuantity((existing?.quantity ?? 0) + clampQuantity(entry.quantity));
    merged.set(entry.key, { ...entry, variantTitle: entry.variantTitle ?? "", quantity });
  }
  return [...merged.values()];
}
