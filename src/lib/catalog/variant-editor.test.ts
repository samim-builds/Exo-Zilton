import { describe, expect, it } from "vitest";
import { copyPricesToAll, imagesFor, moveImageWithinGroup } from "./variant-editor";

const img = (url: string, variantKey: string | null) => ({ url, alt: url, variantKey });

describe("imagesFor", () => {
  it("lists a variant's own photos with their place in the full list", () => {
    const images = [img("a", null), img("b", "v1"), img("c", "v2"), img("d", "v1")];
    expect(imagesFor(images, "v1").map(({ image, index }) => [image.url, index])).toEqual([
      ["b", 1],
      ["d", 3],
    ]);
  });

  it("lists shared photos when asked for null", () => {
    expect(imagesFor([img("a", null), img("b", "v1"), img("c", undefined as unknown as null)], null).map((x) => x.image.url)).toEqual(["a", "c"]);
  });
});

describe("moveImageWithinGroup", () => {
  const images = [img("a", "v1"), img("s", null), img("b", "v1"), img("c", "v1")];

  it("swaps with the neighbouring photo of the same variant, skipping others", () => {
    expect(moveImageWithinGroup(images, 2, -1).map((i) => i.url)).toEqual(["b", "s", "a", "c"]);
    expect(moveImageWithinGroup(images, 0, 1).map((i) => i.url)).toEqual(["b", "s", "a", "c"]);
  });

  it("leaves the list alone at either end of the group", () => {
    expect(moveImageWithinGroup(images, 0, -1)).toBe(images);
    expect(moveImageWithinGroup(images, 3, 1)).toBe(images);
  });
});

describe("copyPricesToAll", () => {
  const v = (key: string, pricePKR: number, compareAtPKR: number | null = null) => ({
    key,
    pricePKR,
    priceUSD: pricePKR / 100,
    compareAtPKR,
    compareAtUSD: null,
    sku: key,
  });

  it("copies one variant's prices to every other variant and keeps their other fields", () => {
    const out = copyPricesToAll([v("a", 1000, 1200), v("b", 2000)], "a");
    expect(out[1]).toEqual({ key: "b", sku: "b", pricePKR: 1000, priceUSD: 10, compareAtPKR: 1200, compareAtUSD: null });
  });

  it("returns the list unchanged for an unknown variant", () => {
    const list = [v("a", 1)];
    expect(copyPricesToAll(list, "zz")).toBe(list);
  });
});
