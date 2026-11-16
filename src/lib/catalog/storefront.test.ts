import { describe, expect, it } from "vitest";
import {
  categorySubtree,
  findByLegacySlug,
  flattenCatalog,
  resolveVariant,
  selectionHref,
  toCatalogProducts,
  variantHref,
  type CatalogProductInput,
} from "./storefront";

const variant = (over: Partial<CatalogProductInput["variants"][number]>): CatalogProductInput["variants"][number] => ({
  id: "v",
  sku: "EZ",
  title: "",
  pricePKR: 0,
  priceUSD: 0,
  compareAtPKR: null,
  compareAtUSD: null,
  trackInventory: false,
  stockQty: 0,
  attributes: {},
  legacySlug: null,
  position: 0,
  active: true,
  isDefault: false,
  optionValueIds: [],
  ...over,
});

const base: CatalogProductInput = {
  id: "p1",
  slug: "mortar-and-pestle",
  name: "Mortar and Pestle",
  subtitle: null,
  description: "Porcelain",
  features: ["Feature"],
  careInstructions: ["Care"],
  deliveryInfo: "Ships",
  specs: { Material: "Porcelain" },
  category: { slug: "mortars", name: "Mortars" },
  options: [
    {
      name: "Size",
      position: 0,
      values: [
        { id: "s2", value: "Size 2", slug: "size-2", position: 1 },
        { id: "s1", value: "Size 1", slug: "size-1", position: 0 },
      ],
    },
  ],
  images: [
    { url: "/p/a.webp", alt: "A", sortOrder: 1, variantId: null },
    { url: "/p/b.webp", alt: "B", sortOrder: 0, variantId: null },
    { url: "/p/v2.webp", alt: "V2", sortOrder: 0, variantId: "v2" },
  ],
  variants: [
    variant({
      id: "v2",
      sku: "EZ-002",
      title: "Size 2",
      pricePKR: 4000,
      priceUSD: 25,
      trackInventory: true,
      attributes: { diameterCm: 12, capacityMl: 300 },
      legacySlug: "mortar-and-pestle-size-2",
      position: 1,
      isDefault: true,
      optionValueIds: ["s2"],
    }),
    variant({
      id: "v1",
      sku: "EZ-001",
      title: "Size 1",
      pricePKR: 3000,
      priceUSD: 20,
      compareAtPKR: 3500,
      attributes: { diameterCm: 10, capacityMl: 200 },
      optionValueIds: ["s1"],
    }),
    variant({ id: "v9", sku: "EZ-009", title: "Hidden", position: 2, active: false, optionValueIds: [] }),
  ],
  legacy: null,
};

const twoOptions: CatalogProductInput = {
  ...base,
  id: "p2",
  slug: "bowl",
  name: "Bowl",
  images: [],
  options: [
    { name: "Colour", position: 0, values: [{ id: "c-w", value: "White", slug: "white", position: 0 }, { id: "c-b", value: "Black", slug: "black", position: 1 }] },
    { name: "Size", position: 1, values: [{ id: "z-s", value: "Small", slug: "small", position: 0 }, { id: "z-l", value: "Large", slug: "large", position: 1 }] },
  ],
  variants: [
    variant({ id: "ws", sku: "B-WS", title: "White / Small", optionValueIds: ["c-w", "z-s"], position: 0 }),
    variant({ id: "wl", sku: "B-WL", title: "White / Large", optionValueIds: ["c-w", "z-l"], position: 1 }),
    variant({ id: "bl", sku: "B-BL", title: "Black / Large", optionValueIds: ["c-b", "z-l"], position: 2 }),
  ],
};

describe("toCatalogProducts", () => {
  const [product] = toCatalogProducts([base]);

  it("keeps active variants in position order", () => {
    expect(product.variants.map((v) => v.sku)).toEqual(["EZ-001", "EZ-002"]);
  });

  it("orders option values by position and derives the URL param from the option name", () => {
    expect(product.options).toEqual([
      { name: "Size", param: "size", values: [{ value: "Size 1", slug: "size-1" }, { value: "Size 2", slug: "size-2" }] },
    ]);
  });

  it("records each variant's selection as option param → value slug", () => {
    expect(product.variants.map((v) => v.selection)).toEqual([{ size: "size-1" }, { size: "size-2" }]);
  });

  it("reads diameter, capacity, compare-at and stock per variant", () => {
    expect(product.variants[0]).toMatchObject({ diameterCm: 10, capacityMl: 200, compareAtPKR: 3500, inStock: true });
    expect(product.variants[1]).toMatchObject({ diameterCm: 12, inStock: false });
  });

  it("prefers variant images, falling back to sorted product images", () => {
    expect(product.variants[1].images.map((i) => i.url)).toEqual(["/p/v2.webp"]);
    expect(product.variants[0].images.map((i) => i.url)).toEqual(["/p/b.webp", "/p/a.webp"]);
  });

  it("keys real variants by id", () => {
    expect(product.variants.map((v) => [v.key, v.id])).toEqual([
      ["v1", "v1"],
      ["v2", "v2"],
    ]);
  });

  it("reads an un-migrated legacy row as a product with one option-less variant", () => {
    const [legacy] = toCatalogProducts([
      {
        ...base,
        slug: "mortar-and-pestle-size-3",
        options: [],
        variants: [],
        images: [{ url: "/s3.webp", alt: "S3", sortOrder: 0, variantId: null }],
        legacy: { sku: "EZ-003", size: "Size 3", diameterCm: 14, capacityMl: 400, pricePKR: 5000, priceUSD: 30, inStock: true },
      },
    ]);
    expect(legacy.options).toEqual([]);
    expect(legacy.variants).toHaveLength(1);
    expect(legacy.variants[0]).toMatchObject({
      key: "legacy:p1",
      id: undefined,
      sku: "EZ-003",
      title: "Size 3",
      pricePKR: 5000,
      selection: {},
    });
  });

  it("drops products with no sellable variant", () => {
    expect(toCatalogProducts([{ ...base, variants: [base.variants[2]] }])).toEqual([]);
  });
});

describe("resolveVariant", () => {
  const [mortar, bowl] = toCatalogProducts([base, twoOptions]);

  it("falls back to the default variant without params", () => {
    expect(resolveVariant(mortar, {}).sku).toBe("EZ-002");
  });

  it("falls back to the first variant when none is flagged default", () => {
    expect(resolveVariant(bowl, {}).sku).toBe("B-WS");
  });

  it("matches the variant named by the params", () => {
    expect(resolveVariant(mortar, { size: "size-1" }).sku).toBe("EZ-001");
    expect(resolveVariant(bowl, { colour: "black", size: "large" }).sku).toBe("B-BL");
  });

  it("fills unspecified options from the fallback variant", () => {
    expect(resolveVariant(bowl, { size: "large" }).sku).toBe("B-WL");
  });

  it("ignores unknown values and array params", () => {
    expect(resolveVariant(mortar, { size: "size-99" }).sku).toBe("EZ-002");
    expect(resolveVariant(mortar, { size: ["size-1", "size-2"] }).sku).toBe("EZ-001");
  });
});

describe("variantHref / selectionHref", () => {
  const [mortar, bowl] = toCatalogProducts([base, twoOptions]);

  it("puts the variant's selection in the query string", () => {
    expect(variantHref(mortar, mortar.variants[0])).toBe("/products/mortar-and-pestle?size=size-1");
    expect(variantHref(bowl, bowl.variants[2])).toBe("/products/bowl?colour=black&size=large");
  });

  it("uses the bare product path when there are no options", () => {
    const [legacy] = toCatalogProducts([
      { ...base, options: [], variants: [variant({ id: "only", sku: "X", optionValueIds: [] })] },
    ]);
    expect(variantHref(legacy, legacy.variants[0])).toBe("/products/mortar-and-pestle");
  });

  it("links an option value to the exact combination when it exists", () => {
    const current = bowl.variants[1]; // White / Large
    expect(selectionHref(bowl, current, "colour", "black")).toEqual({ href: "/products/bowl?colour=black&size=large", available: true });
  });

  it("falls back to any variant with that value when the exact combination is missing", () => {
    const current = bowl.variants[0]; // White / Small — Black / Small doesn't exist
    expect(selectionHref(bowl, current, "colour", "black")).toEqual({ href: "/products/bowl?colour=black&size=large", available: true });
  });

  it("marks values no variant offers as unavailable", () => {
    expect(selectionHref(mortar, mortar.variants[0], "size", "size-9")).toEqual({ href: null, available: false });
  });
});

describe("findByLegacySlug", () => {
  const catalog = toCatalogProducts([base]);

  it("finds the product and variant that replaced an old per-size URL", () => {
    const hit = findByLegacySlug(catalog, "mortar-and-pestle-size-2");
    expect(hit && [hit.product.slug, hit.variant.sku]).toEqual(["mortar-and-pestle", "EZ-002"]);
  });

  it("returns undefined for unknown slugs", () => {
    expect(findByLegacySlug(catalog, "nope")).toBeUndefined();
  });
});

describe("flattenCatalog", () => {
  const cards = flattenCatalog(toCatalogProducts([base]));

  it("emits one card per variant linking to the product page with that variant selected", () => {
    expect(cards.map((c) => [c.name, c.href, c.variantKey])).toEqual([
      ["Mortar and Pestle - Size 1", "/products/mortar-and-pestle?size=size-1", "v1"],
      ["Mortar and Pestle - Size 2", "/products/mortar-and-pestle?size=size-2", "v2"],
    ]);
  });

  it("names option-less products without a suffix", () => {
    const [card] = flattenCatalog(
      toCatalogProducts([{ ...base, options: [], variants: [variant({ id: "only", sku: "X", title: "Default", optionValueIds: [] })] }]),
    );
    expect(card.name).toBe("Mortar and Pestle");
  });
});

describe("categorySubtree", () => {
  const categories = [
    { id: "a", slug: "kitchen", parentId: null },
    { id: "b", slug: "mortars", parentId: "a" },
    { id: "c", slug: "mini-mortars", parentId: "b" },
    { id: "d", slug: "cookware", parentId: null },
    { id: "x", slug: "loop-1", parentId: "y" },
    { id: "y", slug: "loop-2", parentId: "x" },
  ];

  it("collects a category and all its descendants", () => {
    expect([...categorySubtree(categories, "kitchen")].sort()).toEqual(["kitchen", "mini-mortars", "mortars"]);
    expect([...categorySubtree(categories, "cookware")]).toEqual(["cookware"]);
  });

  it("survives cycles and unknown slugs", () => {
    expect([...categorySubtree(categories, "loop-1")].sort()).toEqual(["loop-1", "loop-2"]);
    expect([...categorySubtree(categories, "nope")]).toEqual([]);
  });
});
