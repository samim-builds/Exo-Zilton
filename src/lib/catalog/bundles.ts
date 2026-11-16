// Pure bundle rules. A bundle is a product with one auto-managed variant whose
// price and availability come from its component variants. Client-safe.

export type BundlePricingMode = "FIXED" | "PERCENT_OFF";

export type BundlePricingRule = {
  mode: BundlePricingMode;
  discountPercent: number | null;
  fixedPKR: number | null;
  fixedUSD: number | null;
};

type PricedComponent = { pricePKR: number; priceUSD: number; quantity: number };

export function bundlePricing(rule: BundlePricingRule, components: PricedComponent[]) {
  const fullPKR = components.reduce((sum, c) => sum + c.pricePKR * c.quantity, 0);
  const fullUSD = components.reduce((sum, c) => sum + c.priceUSD * c.quantity, 0);
  const factor = 1 - Math.min(100, Math.max(0, rule.discountPercent ?? 0)) / 100;
  const pricePKR = rule.mode === "FIXED" ? (rule.fixedPKR ?? fullPKR) : Math.round(fullPKR * factor);
  const priceUSD = rule.mode === "FIXED" ? (rule.fixedUSD ?? fullUSD) : Math.round(fullUSD * factor);
  return {
    pricePKR,
    priceUSD,
    compareAtPKR: fullPKR > pricePKR ? fullPKR : null,
    compareAtUSD: fullUSD > priceUSD ? fullUSD : null,
  };
}

type StockedComponent = { quantity: number; trackInventory: boolean; stockQty: number; active: boolean };

/** How many bundles can be sold: null when unlimited (no component tracks stock). */
export function bundleAvailability(components: StockedComponent[]): number | null {
  if (components.length === 0 || components.some((c) => !c.active)) return 0;
  const limits = components.filter((c) => c.trackInventory).map((c) => Math.max(0, Math.floor(c.stockQty / c.quantity)));
  return limits.length === 0 ? null : Math.min(...limits);
}

type Line = { variantId: string | null; quantity: number };

/** Replaces bundle lines with their component lines, for stock checks and movements. */
export function expandBundleLines(lines: Line[], bundles: Map<string, { variantId: string; quantity: number }[]>): Line[] {
  return lines.flatMap((line) => {
    const parts = line.variantId ? bundles.get(line.variantId) : undefined;
    return parts ? parts.map((p) => ({ variantId: p.variantId, quantity: p.quantity * line.quantity })) : [line];
  });
}

export type BundleComponentSnapshot = { variantId: string; sku: string; name: string; quantity: number };

function isSnapshot(value: unknown): value is BundleComponentSnapshot[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((c) => c && typeof c.variantId === "string" && Number.isInteger(c.quantity) && c.quantity > 0)
  );
}

/** Stock lines for sold order items: bundle lines move the components recorded when they were sold. */
export function stockLinesForOrderItems(items: { variantId: string | null; quantity: number; bundleComponents: unknown }[]): Line[] {
  return items.flatMap((item) =>
    isSnapshot(item.bundleComponents)
      ? item.bundleComponents.map((c) => ({ variantId: c.variantId, quantity: c.quantity * item.quantity }))
      : [{ variantId: item.variantId, quantity: item.quantity }],
  );
}
