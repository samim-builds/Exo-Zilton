import { describe, expect, it } from "vitest";
import { toStorefrontProducts, type CatalogProductInput } from "./storefront";

const base: CatalogProductInput = {
  id: "p1",
  slug: "mortar-and-pestle",
  name: "Mortar and Pestle",
  description: "Porcelain",
  features: ["Feature"],
  careInstructions: ["Care"],
  deliveryInfo: "Ships",
  specs: { Material: "Porcelain" },
  images: [
    { url: "/p/a.webp", alt: "A", sortOrder: 1, variantId: null },
    { url: "/p/b.webp", alt: "B", sortOrder: 0, variantId: null },
    { url: "/p/v2.webp", alt: "V2", sortOrder: 0, variantId: "v2" },
  ],
  variants: [
    {
      id: "v2",
      sku: "EZ-002",
      title: "Size 2",
      pricePKR: 4000,
      priceUSD: 25,
      trackInventory: true,
      stockQty: 0,
      attributes: { diameterCm: 12, capacityMl: 300 },
      legacySlug: "mortar-and-pestle-size-2",
      position: 1,
      active: true,
    },
    {
      id: "v1",
      sku: "EZ-001",
      title: "Size 1",
      pricePKR: 3000,
      priceUSD: 20,
      trackInventory: false,
      stockQty: 0,
      attributes: { diameterCm: 10, capacityMl: 200 },
      legacySlug: null,
      position: 0,
      active: true,
    },
    {
      id: "v9",
      sku: "EZ-009",
      title: "Hidden",
      pricePKR: 1,
      priceUSD: 1,
      trackInventory: false,
      stockQty: 0,
      attributes: {},
      legacySlug: null,
      position: 2,
      active: false,
    },
  ],
  legacy: null,
};

describe("toStorefrontProducts", () => {
  const result = toStorefrontProducts([base]);

  it("emits one entry per active variant in position order", () => {
    expect(result.map((p) => p.sku)).toEqual(["EZ-001", "EZ-002"]);
  });

  it("uses the legacy slug when present, else product slug + option slug", () => {
    expect(result.map((p) => p.slug)).toEqual(["mortar-and-pestle-size-1", "mortar-and-pestle-size-2"]);
  });

  it("names entries after the product and variant", () => {
    expect(result[0].name).toBe("Mortar and Pestle - Size 1");
    expect(result[0].size).toBe("Size 1");
  });

  it("reads diameter and capacity from variant attributes", () => {
    expect(result[1]).toMatchObject({ diameterCm: 12, capacityMl: 300, pricePKR: 4000, priceUSD: 25 });
  });

  it("is out of stock only when inventory is tracked and empty", () => {
    expect(result.map((p) => p.inStock)).toEqual([true, false]);
  });

  it("prefers variant images, falling back to sorted product images", () => {
    expect(result[1].images).toEqual(["/p/v2.webp"]);
    expect(result[0].images).toEqual(["/p/b.webp", "/p/a.webp"]);
  });

  it("carries product and variant ids for ordering", () => {
    expect(result.map((p) => [p.productId, p.variantId])).toEqual([
      ["p1", "v1"],
      ["p1", "v2"],
    ]);
  });

  it("reads an un-migrated legacy row as a single variant", () => {
    const [legacy] = toStorefrontProducts([
      {
        ...base,
        slug: "mortar-and-pestle-size-3",
        name: "Mortar and Pestle - Size 3",
        variants: [],
        images: [{ url: "/s3.webp", alt: "S3", sortOrder: 0, variantId: null }],
        legacy: { sku: "EZ-003", size: "Size 3", diameterCm: 14, capacityMl: 400, pricePKR: 5000, priceUSD: 30, inStock: true },
      },
    ]);
    expect(legacy).toMatchObject({
      slug: "mortar-and-pestle-size-3",
      name: "Mortar and Pestle - Size 3",
      productId: "p1",
      variantId: undefined,
      sku: "EZ-003",
      size: "Size 3",
      pricePKR: 5000,
      images: ["/s3.webp"],
    });
  });
});
