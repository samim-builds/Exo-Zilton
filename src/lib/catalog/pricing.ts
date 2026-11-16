import { formatPKR, formatUSD } from "@/lib/format";

export type PriceRange = { minPKR: number; maxPKR: number; minUSD: number; maxUSD: number };

export function priceRange(variants: { pricePKR: number; priceUSD: number; active: boolean }[]): PriceRange | null {
  const active = variants.filter((v) => v.active);
  if (active.length === 0) return null;
  const pkr = active.map((v) => v.pricePKR);
  const usd = active.map((v) => v.priceUSD);
  return { minPKR: Math.min(...pkr), maxPKR: Math.max(...pkr), minUSD: Math.min(...usd), maxUSD: Math.max(...usd) };
}

export function formatPriceRange(min: number, max: number, currency: "PKR" | "USD"): string {
  const format = currency === "PKR" ? formatPKR : formatUSD;
  return min === max ? format(min) : `${format(min)} – ${format(max)}`;
}
