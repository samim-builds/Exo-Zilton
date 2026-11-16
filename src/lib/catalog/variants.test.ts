import { describe, expect, it } from "vitest";
import { generateVariantCombos, slugifyOptionValue, suggestSku, variantTitle } from "./variants";

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
