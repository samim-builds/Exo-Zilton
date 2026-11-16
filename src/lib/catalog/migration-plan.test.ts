import { describe, expect, it } from "vitest";
import { planCatalogMigration, type LegacyProductRow } from "./migration-plan";

const row = (n: number, extra: Partial<LegacyProductRow> = {}): LegacyProductRow => ({
  id: `old-${n}`,
  slug: `mortar-and-pestle-size-${n}`,
  name: `Mortar and Pestle - Size ${n}`,
  sku: `EZ-00${n}`,
  size: `Size ${n}`,
  diameterCm: 10 + n,
  capacityMl: 100 * (n + 1),
  pricePKR: 3000 + n * 500,
  priceUSD: 20 + n,
  inStock: true,
  published: true,
  sortOrder: n,
  description: `Description ${n}`,
  features: ["F"],
  careInstructions: ["C"],
  deliveryInfo: "D",
  specs: { Material: "Porcelain" },
  images: [{ id: `img-${n}`, url: `/products/size-${n}/front.webp`, alt: "Front", sortOrder: 0 }],
  ...extra,
});

describe("planCatalogMigration", () => {
  const plan = planCatalogMigration([row(2), row(0, { sortOrder: 0 }), row(1, { inStock: false, published: false })])!;

  it("creates one product named without the size suffix", () => {
    expect(plan.product).toMatchObject({ slug: "mortar-and-pestle", name: "Mortar and Pestle" });
  });

  it("takes shared copy from the first row by sort order", () => {
    expect(plan.product.description).toBe("Description 0");
  });

  it("strips the first row size from shared copy and specs", () => {
    const sized = planCatalogMigration([
      row(0, {
        description: "Meet the Exo Zilton Size 0 Mortar & Pestle.",
        specs: { Size: "Size 0", Diameter: "10cm", Capacity: "140ml", Material: "Porcelain" },
      }),
    ])!;
    expect(sized.product.description).toBe("Meet the Exo Zilton Mortar & Pestle.");
    expect(sized.product.specs).toEqual({ Material: "Porcelain" });
  });

  it("creates one Size option value per row in sort order", () => {
    expect(plan.optionValues).toEqual([
      { value: "Size 0", slug: "size-0", position: 0 },
      { value: "Size 1", slug: "size-1", position: 1 },
      { value: "Size 2", slug: "size-2", position: 2 },
    ]);
  });

  it("maps each row to a variant keeping sku, prices, legacy slug and dimensions", () => {
    expect(plan.variants[2]).toMatchObject({
      legacyId: "old-2",
      sku: "EZ-002",
      title: "Size 2",
      optionSlug: "size-2",
      pricePKR: 4000,
      priceUSD: 22,
      legacySlug: "mortar-and-pestle-size-2",
      attributes: { diameterCm: 12, capacityMl: 300 },
      active: true,
      isDefault: false,
      imageIds: ["img-2"],
    });
    expect(plan.variants[0].isDefault).toBe(true);
  });

  it("keeps out-of-stock and unpublished sizes that way", () => {
    expect(plan.variants[1]).toMatchObject({ trackInventory: true, stockQty: 0, active: false });
    expect(plan.variants[0]).toMatchObject({ trackInventory: false });
  });

  it("returns null when there is nothing to migrate", () => {
    expect(planCatalogMigration([])).toBeNull();
  });
});
