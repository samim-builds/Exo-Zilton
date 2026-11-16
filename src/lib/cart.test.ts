import { describe, expect, it } from "vitest";
import { parseStoredCart } from "./cart";

const item = { key: "v1", href: "/products/m?size=size-1", name: "Mortar and Pestle", variantTitle: "Size 1", sku: "EZ-001", pricePKR: 3000, priceUSD: 20, quantity: 2 };

describe("parseStoredCart", () => {
  it("reads a valid v2 cart", () => {
    expect(parseStoredCart(JSON.stringify([item]))).toEqual([item]);
  });

  it("returns an empty cart for missing or corrupt storage", () => {
    expect(parseStoredCart(null)).toEqual([]);
    expect(parseStoredCart("{not json")).toEqual([]);
    expect(parseStoredCart(JSON.stringify({ items: [] }))).toEqual([]);
  });

  it("drops v1 items keyed by slug instead of variant", () => {
    const v1 = { slug: "mortar-and-pestle-size-1", name: "x", size: "Size 1", pricePKR: 1, priceUSD: 1, quantity: 1 };
    expect(parseStoredCart(JSON.stringify([v1, item]))).toEqual([item]);
  });

  it("clamps quantities to 1–99 and merges duplicate keys", () => {
    const parsed = parseStoredCart(JSON.stringify([{ ...item, quantity: 0 }, { ...item, quantity: 500 }]));
    expect(parsed).toEqual([{ ...item, quantity: 99 }]);
  });
});
