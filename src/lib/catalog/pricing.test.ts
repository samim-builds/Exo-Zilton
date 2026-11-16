import { describe, expect, it } from "vitest";
import { formatPriceRange, priceRange } from "./pricing";

const v = (pricePKR: number, priceUSD: number, active = true) => ({ pricePKR, priceUSD, active });

describe("priceRange", () => {
  it("covers active variants only", () => {
    expect(priceRange([v(3000, 20), v(5000, 35), v(100, 1, false)])).toEqual({
      minPKR: 3000,
      maxPKR: 5000,
      minUSD: 20,
      maxUSD: 35,
    });
  });

  it("returns null when nothing is active", () => {
    expect(priceRange([v(1, 1, false)])).toBeNull();
  });
});

describe("formatPriceRange", () => {
  it("shows a single price when min equals max", () => {
    expect(formatPriceRange(3000, 3000, "PKR")).toBe("Rs. 3,000");
  });

  it("shows a from–to range otherwise", () => {
    expect(formatPriceRange(20, 35, "USD")).toBe("$20 – $35");
  });
});
