import { describe, expect, it } from "vitest";
import type { CatalogProduct, CatalogVariant } from "@/lib/product-types";
import { priceOrderLines } from "./order-pricing";

const v = (over: Partial<CatalogVariant>): CatalogVariant => ({
  key: "k",
  id: "k",
  sku: "SKU",
  title: "",
  selection: {},
  pricePKR: 0,
  priceUSD: 0,
  compareAtPKR: null,
  compareAtUSD: null,
  inStock: true,
  diameterCm: 0,
  capacityMl: 0,
  images: [],
  legacySlug: null,
  isDefault: false,
  ...over,
});

const catalog: CatalogProduct[] = [
  {
    id: "p1",
    slug: "mortar-and-pestle",
    name: "Mortar and Pestle",
    subtitle: null,
    description: "",
    features: [],
    careInstructions: [],
    deliveryInfo: "",
    specs: {},
    category: null,
    options: [{ name: "Size", param: "size", values: [] }],
    variants: [
      v({ key: "v1", id: "v1", sku: "EZ-001", title: "Size 1", pricePKR: 3000, priceUSD: 20 }),
      v({ key: "v2", id: "v2", sku: "EZ-002", title: "Size 2", pricePKR: 4000, priceUSD: 25, inStock: false }),
    ],
  },
  {
    id: "p9",
    slug: "old-row",
    name: "Old Row",
    subtitle: null,
    description: "",
    features: [],
    careInstructions: [],
    deliveryInfo: "",
    specs: {},
    category: null,
    options: [],
    variants: [v({ key: "legacy:p9", id: undefined, sku: "OLD", title: "Size 9", pricePKR: 900, priceUSD: 9 })],
  },
];

describe("priceOrderLines", () => {
  it("prices lines from the catalog in the order currency", () => {
    const result = priceOrderLines(catalog, [{ variantId: "v1", quantity: 2 }], "USD");
    expect(result).toEqual({
      ok: true,
      subtotal: 40,
      items: [
        { productId: "p1", variantId: "v1", productName: "Mortar and Pestle - Size 1", sku: "EZ-001", size: "Size 1", unitPrice: 20, quantity: 2 },
      ],
    });
  });

  it("merges duplicate lines and caps quantity at 99", () => {
    const result = priceOrderLines(catalog, [{ variantId: "v1", quantity: 60 }, { variantId: "v1", quantity: 60 }], "PKR");
    expect(result.ok && result.items.map((i) => i.quantity)).toEqual([99]);
    expect(result.ok && result.subtotal).toBe(99 * 3000);
  });

  it("rejects unknown and out-of-stock variants", () => {
    expect(priceOrderLines(catalog, [{ variantId: "v1", quantity: 1 }, { variantId: "v2", quantity: 1 }, { variantId: "nope", quantity: 1 }], "PKR")).toEqual({
      ok: false,
      unavailable: ["v2", "nope"],
    });
  });

  it("orders legacy rows without a variant id against their product", () => {
    const result = priceOrderLines(catalog, [{ variantId: "legacy:p9", quantity: 1 }], "PKR");
    expect(result.ok && result.items[0]).toMatchObject({ productId: "p9", variantId: null, productName: "Old Row", unitPrice: 900 });
  });
});

describe("priceOrderLines with bundles", () => {
  const bundle: CatalogProduct = {
    ...catalog[0],
    id: "b1",
    slug: "gift-set",
    name: "Gift set",
    options: [],
    variants: [v({ key: "bv", id: "bv", sku: "EZ-GIFT", pricePKR: 9000, priceUSD: 60 })],
    bundle: { items: [{ variantId: "v1", sku: "EZ-001", name: "Mortar and Pestle - Size 1", quantity: 2, href: "/products/mortar-and-pestle" }] },
  };

  it("records the components sold with a bundle line", () => {
    const result = priceOrderLines([bundle], [{ variantId: "bv", quantity: 1 }], "PKR");
    expect(result.ok && result.items[0].bundleComponents).toEqual([{ variantId: "v1", sku: "EZ-001", name: "Mortar and Pestle - Size 1", quantity: 2 }]);
  });
});
