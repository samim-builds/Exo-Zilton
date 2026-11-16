import { describe, expect, it } from "vitest";
import { adjustmentDelta, isLowStock, reinstateBlockedReason, returnRecordedStock, stockMovementsForTransition, stockShortfalls } from "./inventory";

const lines = [
  { variantId: "v1", quantity: 2 },
  { variantId: "v2", quantity: 1 },
  { variantId: "v1", quantity: 1 },
  { variantId: null, quantity: 5 },
];
const tracked = new Set(["v1"]);

describe("stockMovementsForTransition", () => {
  it("takes tracked stock when an order is confirmed, merging lines per variant", () => {
    expect(stockMovementsForTransition("PENDING", "CONFIRMED", lines, tracked)).toEqual([{ variantId: "v1", delta: -3, reason: "ORDER" }]);
  });

  it("takes stock when a pending order jumps straight to shipped", () => {
    expect(stockMovementsForTransition("PENDING", "SHIPPED", lines, tracked)).toEqual([{ variantId: "v1", delta: -3, reason: "ORDER" }]);
  });

  it("does nothing between committed states", () => {
    expect(stockMovementsForTransition("CONFIRMED", "SHIPPED", lines, tracked)).toEqual([]);
    expect(stockMovementsForTransition("SHIPPED", "DELIVERED", lines, tracked)).toEqual([]);
  });

  it("returns stock when a committed order is cancelled", () => {
    expect(stockMovementsForTransition("SHIPPED", "CANCELLED", lines, tracked)).toEqual([{ variantId: "v1", delta: 3, reason: "CANCEL" }]);
  });

  it("does nothing when a pending order is cancelled", () => {
    expect(stockMovementsForTransition("PENDING", "CANCELLED", lines, tracked)).toEqual([]);
  });

  it("takes stock again when a cancelled order is reinstated as confirmed", () => {
    expect(stockMovementsForTransition("CANCELLED", "CONFIRMED", lines, tracked)).toEqual([{ variantId: "v1", delta: -3, reason: "ORDER" }]);
  });

  it("returns stock when a confirmed order is moved back to pending", () => {
    expect(stockMovementsForTransition("CONFIRMED", "PENDING", lines, tracked)).toEqual([{ variantId: "v1", delta: 3, reason: "CANCEL" }]);
  });
});

describe("stockShortfalls", () => {
  const stock = new Map([
    ["v1", { trackInventory: true, stockQty: 2 }],
    ["v2", { trackInventory: false, stockQty: 0 }],
  ]);

  it("reports tracked variants ordered beyond stock, summing duplicate lines", () => {
    expect(stockShortfalls(lines, stock)).toEqual([{ variantId: "v1", requested: 3, available: 2 }]);
  });

  it("is empty when everything fits", () => {
    expect(stockShortfalls([{ variantId: "v1", quantity: 2 }], stock)).toEqual([]);
  });

  it("treats negative stock as zero available", () => {
    expect(stockShortfalls([{ variantId: "v1", quantity: 1 }], new Map([["v1", { trackInventory: true, stockQty: -2 }]]))).toEqual([
      { variantId: "v1", requested: 1, available: 0 },
    ]);
  });
});

describe("adjustmentDelta", () => {
  it("turns a 'set to' count into a delta", () => {
    expect(adjustmentDelta({ mode: "set", value: 10 }, 4)).toBe(6);
    expect(adjustmentDelta({ mode: "set", value: 0 }, 4)).toBe(-4);
  });

  it("passes an add/remove amount through", () => {
    expect(adjustmentDelta({ mode: "add", value: -3 }, 4)).toBe(-3);
  });
});

describe("isLowStock", () => {
  it("flags tracked variants at or below their threshold", () => {
    expect(isLowStock({ trackInventory: true, stockQty: 5, lowStockThreshold: 5 })).toBe(true);
    expect(isLowStock({ trackInventory: true, stockQty: 6, lowStockThreshold: 5 })).toBe(false);
    expect(isLowStock({ trackInventory: false, stockQty: 0, lowStockThreshold: 5 })).toBe(false);
  });
});

describe("returnRecordedStock", () => {
  it("gives back exactly what the order took, per variant", () => {
    expect(
      returnRecordedStock([
        { variantId: "a", delta: -2 },
        { variantId: "b", delta: -1 },
      ]),
    ).toEqual([
      { variantId: "a", delta: 2, reason: "CANCEL" },
      { variantId: "b", delta: 1, reason: "CANCEL" },
    ]);
  });

  it("nets earlier take-and-return cycles so a re-confirmed order returns once", () => {
    expect(
      returnRecordedStock([
        { variantId: "a", delta: -2 },
        { variantId: "a", delta: 2 },
        { variantId: "a", delta: -2 },
      ]),
    ).toEqual([{ variantId: "a", delta: 2, reason: "CANCEL" }]);
  });

  it("returns nothing when the order took nothing (variant was untracked at confirmation)", () => {
    expect(returnRecordedStock([])).toEqual([]);
    expect(returnRecordedStock([{ variantId: "a", delta: -1 }, { variantId: "a", delta: 1 }])).toEqual([]);
  });
});

describe("reinstateBlockedReason", () => {
  it("blocks reopening a cancelled order that was paid partly by gift voucher", () => {
    expect(reinstateBlockedReason("CANCELLED", "CONFIRMED", { voucherAmount: 500 })).toMatch(/voucher/);
  });

  it("allows reopening an order without a voucher, and every other change", () => {
    expect(reinstateBlockedReason("CANCELLED", "PENDING", { voucherAmount: 0 })).toBeNull();
    expect(reinstateBlockedReason("PENDING", "CANCELLED", { voucherAmount: 500 })).toBeNull();
    expect(reinstateBlockedReason("CANCELLED", "CANCELLED", { voucherAmount: 500 })).toBeNull();
  });
});
