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
