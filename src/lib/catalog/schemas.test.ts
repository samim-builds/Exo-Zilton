import { describe, expect, it } from "vitest";
import { productInputSchema, type ProductInput } from "./schemas";

const variant = (key: string, combo: Record<string, string>, sku: string) => ({
  key,
  combo,
  sku,
  pricePKR: 3000,
  priceUSD: 20,
  trackInventory: false,
  stockQty: 0,
  lowStockThreshold: 5,
  attributes: {},
  active: true,
});

const valid: ProductInput = {
  name: "Mortar and Pestle",
  slug: "mortar-and-pestle",
  categoryId: null,
  status: "ACTIVE",
  description: "Porcelain mortar",
  features: [],
  careInstructions: [],
  deliveryInfo: "",
  specs: [],
  attributes: {},
  tags: [],
  featured: false,
  sortOrder: 0,
  options: [{ name: "Size", values: ["S", "L"] }],
  variants: [variant("a", { Size: "S" }, "EZ-S"), variant("b", { Size: "L" }, "EZ-L")],
  images: [{ url: "/a.webp", alt: "A", variantKey: "b" }],
};

function issues(input: unknown) {
  const result = productInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("productInputSchema", () => {
  it("accepts a valid product", () => {
    expect(issues(valid)).toEqual([]);
  });

  it("accepts a product without options and a single default variant", () => {
    expect(issues({ ...valid, options: [], variants: [variant("a", {}, "EZ-1")], images: [] })).toEqual([]);
  });

  it("requires a lowercase hyphenated slug", () => {
    expect(issues({ ...valid, slug: "Mortar Pestle" })).toEqual([
      "slug: Use lowercase letters, numbers and hyphens",
    ]);
  });

  it("requires at least one variant", () => {
    expect(issues({ ...valid, variants: [], images: [] })).toEqual(["variants: Add at least one variant"]);
  });

  it("rejects duplicate SKUs", () => {
    expect(issues({ ...valid, variants: [variant("a", { Size: "S" }, "EZ-1"), variant("b", { Size: "L" }, "ez-1")] })).toEqual([
      "variants.1.sku: SKU is used by another variant",
    ]);
  });

  it("rejects two variants with the same option values", () => {
    expect(issues({ ...valid, variants: [variant("a", { Size: "S" }, "A"), variant("b", { Size: "S" }, "B")], images: [] })).toEqual([
      "variants.1.combo: Another variant already has these options",
    ]);
  });

  it("rejects variants whose values don't match the options", () => {
    expect(issues({ ...valid, variants: [variant("a", { Size: "XL" }, "A"), variant("b", {}, "B")], images: [] })).toEqual([
      'variants.0.combo: "XL" is not a value of Size',
      "variants.1.combo: Choose a value for Size",
    ]);
  });

  it("rejects duplicate option names and images pointing at unknown variants", () => {
    expect(
      issues({
        ...valid,
        options: [
          { name: "Size", values: ["S", "L"] },
          { name: "size", values: ["M"] },
        ],
        variants: [variant("a", { Size: "S", size: "M" }, "A")],
        images: [{ url: "/x.webp", alt: "X", variantKey: "zzz" }],
      }),
    ).toEqual(["options.1.name: Option names must be unique", "images.0.variantKey: Unknown variant"]);
  });
});

describe("productInputSchema for bundles", () => {
  const bundle: ProductInput = {
    ...valid,
    slug: "gift-set",
    kind: "BUNDLE",
    options: [],
    variants: [variant("default", {}, "EZ-GIFT")],
    images: [],
    bundle: { mode: "PERCENT_OFF", discountPercent: 10, items: [{ variantId: "v1", quantity: 2 }] },
  };

  it("accepts a bundle with contents", () => {
    expect(issues(bundle)).toEqual([]);
  });

  it("defaults to a standard product with no bundle", () => {
    const parsed = productInputSchema.parse(valid);
    expect(parsed.kind).toBe("STANDARD");
    expect(parsed.bundle).toBeNull();
  });

  it("needs at least one item, each listed once", () => {
    expect(issues({ ...bundle, bundle: { ...bundle.bundle, items: [] } })).toEqual(["bundle.items: Add at least one item to the bundle"]);
    expect(
      issues({ ...bundle, bundle: { ...bundle.bundle, items: [{ variantId: "v1", quantity: 1 }, { variantId: "v1", quantity: 1 }] } }),
    ).toEqual(["bundle.items.1.variantId: This item is already in the bundle"]);
  });

  it("needs a discount for percent-off pricing", () => {
    expect(issues({ ...bundle, bundle: { ...bundle.bundle, discountPercent: null } })).toEqual([
      "bundle.discountPercent: Enter the discount, from 1 to 90%",
    ]);
  });

  it("has exactly one variant and no options", () => {
    expect(issues({ ...bundle, options: valid.options, variants: valid.variants })).toEqual([
      "options: A bundle has no options",
      "variants: A bundle has a single SKU",
    ]);
  });

  it("needs bundle settings when the kind is bundle", () => {
    expect(issues({ ...bundle, bundle: null })).toEqual(["bundle: Add the bundle's contents"]);
  });
});
