import { describe, expect, it } from "vitest";
import { bundleAvailability, bundlePricing, expandBundleLines, stockLinesForOrderItems } from "./bundles";

const components = [
  { pricePKR: 10000, priceUSD: 50, quantity: 2 },
  { pricePKR: 5000, priceUSD: 25, quantity: 1 },
];

describe("bundlePricing", () => {
  it("prices a percent-off bundle from its components and shows the full price as compare-at", () => {
    expect(bundlePricing({ mode: "PERCENT_OFF", discountPercent: 10, fixedPKR: null, fixedUSD: null }, components)).toEqual({
      pricePKR: 22500,
      priceUSD: 113, // 125 × 0.9 = 112.5, rounded
      compareAtPKR: 25000,
      compareAtUSD: 125,
    });
  });

  it("uses the fixed price when set", () => {
    expect(bundlePricing({ mode: "FIXED", discountPercent: null, fixedPKR: 20000, fixedUSD: 100 }, components)).toEqual({
      pricePKR: 20000,
      priceUSD: 100,
      compareAtPKR: 25000,
      compareAtUSD: 125,
    });
  });

  it("drops compare-at when the bundle is not cheaper than buying separately", () => {
    const p = bundlePricing({ mode: "FIXED", discountPercent: null, fixedPKR: 30000, fixedUSD: 125 }, components);
    expect(p.compareAtPKR).toBeNull();
    expect(p.compareAtUSD).toBeNull();
  });

  it("treats a missing percent as no discount", () => {
    expect(bundlePricing({ mode: "PERCENT_OFF", discountPercent: null, fixedPKR: null, fixedUSD: null }, components).pricePKR).toBe(25000);
  });
});

describe("bundleAvailability", () => {
  it("is limited by the scarcest tracked component", () => {
    expect(
      bundleAvailability([
        { quantity: 2, trackInventory: true, stockQty: 7, active: true },
        { quantity: 1, trackInventory: true, stockQty: 5, active: true },
      ]),
    ).toBe(3);
  });

  it("is unlimited (null) when no component tracks stock", () => {
    expect(bundleAvailability([{ quantity: 1, trackInventory: false, stockQty: 0, active: true }])).toBeNull();
  });

  it("is zero when a component is inactive or out of stock", () => {
    expect(bundleAvailability([{ quantity: 1, trackInventory: false, stockQty: 0, active: false }])).toBe(0);
    expect(bundleAvailability([{ quantity: 1, trackInventory: true, stockQty: -1, active: true }])).toBe(0);
  });

  it("is zero for an empty bundle", () => {
    expect(bundleAvailability([])).toBe(0);
  });
});

describe("expandBundleLines", () => {
  it("replaces bundle lines with their components times the bundle quantity", () => {
    const bundles = new Map([["b1", [{ variantId: "v1", quantity: 2 }, { variantId: "v2", quantity: 1 }]]]);
    expect(
      expandBundleLines(
        [
          { variantId: "b1", quantity: 3 },
          { variantId: "v1", quantity: 1 },
          { variantId: null, quantity: 1 },
        ],
        bundles,
      ),
    ).toEqual([
      { variantId: "v1", quantity: 6 },
      { variantId: "v2", quantity: 3 },
      { variantId: "v1", quantity: 1 },
      { variantId: null, quantity: 1 },
    ]);
  });
});

describe("stockLinesForOrderItems", () => {
  it("moves the components recorded on a bundle line, times the bundles sold", () => {
    expect(
      stockLinesForOrderItems([
        { variantId: "bundle", quantity: 2, bundleComponents: [{ variantId: "a", sku: "A", name: "A", quantity: 3 }] },
        { variantId: "b", quantity: 1, bundleComponents: null },
      ]),
    ).toEqual([
      { variantId: "a", quantity: 6 },
      { variantId: "b", quantity: 1 },
    ]);
  });

  it("treats a malformed snapshot as an ordinary line", () => {
    expect(stockLinesForOrderItems([{ variantId: "x", quantity: 1, bundleComponents: { nope: true } }])).toEqual([{ variantId: "x", quantity: 1 }]);
  });
});
