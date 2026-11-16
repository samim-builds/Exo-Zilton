import { describe, expect, it } from "vitest";
import { fillMissingSkus, generateVariantCombos, slugifyOptionValue, suggestSku, syncVariants, variantTitle } from "./variants";

describe("slugifyOptionValue", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyOptionValue("Size 3")).toBe("size-3");
    expect(slugifyOptionValue("  Natural / Oak ")).toBe("natural-oak");
  });
});

describe("generateVariantCombos", () => {
  it("returns a single empty combo when there are no options", () => {
    expect(generateVariantCombos([])).toEqual([{}]);
  });

  it("builds the cartesian product in option order", () => {
    const combos = generateVariantCombos([
      { name: "Size", values: ["S", "L"] },
      { name: "Colour", values: ["White", "Black"] },
    ]);
    expect(combos).toEqual([
      { Size: "S", Colour: "White" },
      { Size: "S", Colour: "Black" },
      { Size: "L", Colour: "White" },
      { Size: "L", Colour: "Black" },
    ]);
  });

  it("skips options with no values", () => {
    expect(generateVariantCombos([{ name: "Size", values: ["S"] }, { name: "Colour", values: [] }])).toEqual([
      { Size: "S" },
    ]);
  });
});

describe("variantTitle", () => {
  it("joins option values in order", () => {
    expect(variantTitle({ Size: "Size 3", Colour: "White" })).toBe("Size 3 / White");
    expect(variantTitle({})).toBe("Default");
  });
});

describe("suggestSku", () => {
  it("appends compact uppercase option codes to the base", () => {
    expect(suggestSku("EZ-MP", { Size: "Size 3", Colour: "Off white" })).toBe("EZ-MP-SIZE3-OFFWHITE");
    expect(suggestSku("ez-mp", {})).toBe("EZ-MP");
  });
});

describe("syncVariants", () => {
  type V = { key: string; combo: Record<string, string>; sku: string; pricePKR: number };
  const make = (combo: Record<string, string>, template: V | undefined): V => ({
    key: `new-${Object.values(combo).join("-")}`,
    combo,
    sku: `NEW-${Object.values(combo).join("-")}`,
    pricePKR: template?.pricePKR ?? 0,
  });

  it("keeps matching variants, adds missing combos and drops stale ones, in option order", () => {
    const existing: V[] = [
      { key: "l", combo: { Size: "L" }, sku: "L", pricePKR: 500 },
      { key: "x", combo: { Size: "XL" }, sku: "XL", pricePKR: 900 },
    ];
    const result = syncVariants([{ name: "Size", values: ["S", "L"] }], existing, make);
    expect(result.map((v) => v.key)).toEqual(["new-S", "l"]);
    expect(result[0].pricePKR).toBe(500);
  });

  it("turns a single default variant into the first combo when options are added", () => {
    const existing: V[] = [{ key: "d", combo: {}, sku: "BASE", pricePKR: 300 }];
    const result = syncVariants([{ name: "Size", values: ["S", "L"] }], existing, make);
    expect(result).toEqual([
      { key: "d", combo: { Size: "S" }, sku: "BASE", pricePKR: 300 },
      { key: "new-L", combo: { Size: "L" }, sku: "NEW-L", pricePKR: 300 },
    ]);
  });

  it("ignores combo keys for options that no longer exist when matching", () => {
    const existing: V[] = [{ key: "a", combo: { Size: "S", Colour: "Red" }, sku: "A", pricePKR: 1 }];
    expect(syncVariants([{ name: "Size", values: ["S"] }], existing, make)).toEqual([
      { key: "a", combo: { Size: "S" }, sku: "A", pricePKR: 1 },
    ]);
  });
});

describe("fillMissingSkus", () => {
  it("suggests a SKU only for variants whose SKU is blank", () => {
    const variants = [
      { combo: { Size: "Size 0" }, sku: "" },
      { combo: { Size: "Size 1" }, sku: "KEEP-ME" },
      { combo: { Size: "Size 2" }, sku: "   " },
    ];
    expect(fillMissingSkus(variants, "ez-mp").map((v) => v.sku)).toEqual(["EZ-MP-SIZE0", "KEEP-ME", "EZ-MP-SIZE2"]);
  });
});
