import { describe, expect, it } from "vitest";
import { orderAdjustments } from "./order-schema";

describe("orderAdjustments", () => {
  it("lists the discount and gift voucher as negative lines", () => {
    expect(
      orderAdjustments({ discountCode: "SAVE10", discountAmount: 4600, voucherCode: "EZ-AB12-CD34", voucherAmount: 1000 }),
    ).toEqual([
      { label: "Discount (SAVE10)", amount: -4600 },
      { label: "Gift voucher (EZ-AB12-CD34)", amount: -1000 },
    ]);
  });

  it("omits codes that took nothing off", () => {
    expect(orderAdjustments({ discountCode: "FREESHIP", discountAmount: 0, voucherCode: null, voucherAmount: 0 })).toEqual([]);
  });
});
