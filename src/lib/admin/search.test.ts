import { describe, expect, it } from "vitest";
import { matchNav, parseSearch } from "./search";

describe("parseSearch", () => {
  it("reads an order number with or without #", () => {
    expect(parseSearch("#12")).toEqual({ text: "#12", orderNumber: 12 });
    expect(parseSearch(" 7 ")).toEqual({ text: "7", orderNumber: 7 });
  });

  it("leaves words as text only", () => {
    expect(parseSearch("gift set")).toEqual({ text: "gift set", orderNumber: null });
  });

  it("ignores blank and oversized input", () => {
    expect(parseSearch("   ")).toEqual({ text: "", orderNumber: null });
    expect(parseSearch("x".repeat(200)).text).toHaveLength(80);
  });
});

describe("matchNav", () => {
  const items = [
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/catalog/bundles", label: "Bundles" },
    { href: "/admin/marketing/vouchers", label: "Gift vouchers" },
  ];

  it("returns everything for an empty query", () => {
    expect(matchNav(items, "")).toEqual(items);
  });

  it("matches the start of any word, ignoring case", () => {
    expect(matchNav(items, "vou").map((i) => i.label)).toEqual(["Gift vouchers"]);
    expect(matchNav(items, "B").map((i) => i.label)).toEqual(["Bundles"]);
  });

  it("does not match inside a word", () => {
    expect(matchNav(items, "rders")).toEqual([]);
  });
});
