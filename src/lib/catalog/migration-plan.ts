import { slugifyOptionValue } from "./variants";

// Plans the one-time conversion of per-size product rows into a single
// product with one "Size" variant per row. Pure, so it is unit-tested; the
// script in prisma/data/catalog-v2.ts applies it to the database.

export type LegacyProductRow = {
  id: string;
  slug: string;
  name: string;
  sku: string | null;
  size: string | null;
  diameterCm: number | null;
  capacityMl: number | null;
  pricePKR: number | null;
  priceUSD: number | null;
  inStock: boolean;
  published: boolean;
  sortOrder: number;
  description: string;
  features: string[];
  careInstructions: string[];
  deliveryInfo: string;
  specs: unknown;
  images: { id: string; url: string; alt: string; sortOrder: number }[];
};

export const MIGRATED_PRODUCT_SLUG = "mortar-and-pestle";

export function planCatalogMigration(rows: LegacyProductRow[]) {
  const legacy = [...rows]
    .filter((r) => r.size && r.sku && r.pricePKR !== null && r.priceUSD !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.diameterCm ?? 0) - (b.diameterCm ?? 0));
  if (legacy.length === 0) return null;

  const first = legacy[0];
  return {
    product: {
      slug: MIGRATED_PRODUCT_SLUG,
      name: first.name.replace(/\s*-\s*Size\s+\S+$/i, "").trim(),
      description: first.description,
      features: first.features,
      careInstructions: first.careInstructions,
      deliveryInfo: first.deliveryInfo,
      specs: first.specs,
    },
    optionValues: legacy.map((r, i) => ({ value: r.size!, slug: slugifyOptionValue(r.size!), position: i })),
    variants: legacy.map((r, i) => ({
      legacyId: r.id,
      sku: r.sku!,
      title: r.size!,
      optionSlug: slugifyOptionValue(r.size!),
      pricePKR: r.pricePKR!,
      priceUSD: r.priceUSD!,
      // Out-of-stock sizes become tracked with zero stock; the rest stay untracked.
      trackInventory: !r.inStock,
      stockQty: 0,
      attributes: { diameterCm: r.diameterCm ?? 0, capacityMl: r.capacityMl ?? 0 },
      legacySlug: r.slug,
      position: i,
      active: r.published,
      isDefault: i === 0,
      imageIds: r.images.map((img) => img.id),
    })),
  };
}
