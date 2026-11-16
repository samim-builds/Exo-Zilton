import type { CatalogProduct } from "@/lib/product-types";
import type { BundleComponentSnapshot } from "./bundles";

export type OrderLineRequest = { variantId: string; quantity: number };

export type PricedOrderItem = {
  productId: string | null;
  variantId: string | null;
  productName: string;
  sku: string;
  size: string;
  unitPrice: number;
  quantity: number;
  /** Bundle lines only: the components one bundle held when sold. */
  bundleComponents?: BundleComponentSnapshot[];
};

export type PricedOrder = { ok: true; items: PricedOrderItem[]; subtotal: number } | { ok: false; unavailable: string[] };

const MAX_QTY = 99;

/** Prices cart lines server-side from the catalog; never trusts client prices. */
export function priceOrderLines(catalog: CatalogProduct[], lines: OrderLineRequest[], currency: "PKR" | "USD"): PricedOrder {
  const quantities = new Map<string, number>();
  for (const line of lines) {
    quantities.set(line.variantId, Math.min(MAX_QTY, (quantities.get(line.variantId) ?? 0) + line.quantity));
  }

  const index = new Map(catalog.flatMap((product) => product.variants.map((variant) => [variant.key, { product, variant }] as const)));
  const unavailable = [...quantities.keys()].filter((key) => !index.get(key)?.variant.inStock);
  if (unavailable.length > 0) return { ok: false, unavailable };

  const items = [...quantities].map(([key, quantity]): PricedOrderItem => {
    const { product, variant } = index.get(key)!;
    return {
      productId: product.id ?? null,
      variantId: variant.id ?? null,
      productName: product.options.length > 0 && variant.title ? `${product.name} - ${variant.title}` : product.name,
      sku: variant.sku,
      size: variant.title,
      unitPrice: currency === "PKR" ? variant.pricePKR : variant.priceUSD,
      quantity,
      ...(product.bundle && {
        bundleComponents: product.bundle.items.map(({ variantId, sku, name, quantity: perBundle }) => ({ variantId, sku, name, quantity: perBundle })),
      }),
    };
  });
  return { ok: true, items, subtotal: items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0) };
}
