import { describe, expect, it } from "vitest";
import { effectiveAttributes, validateAttributeValues, type AttributeDef } from "./attributes";

const def = (key: string, extra: Partial<AttributeDef> = {}): AttributeDef => ({
  key,
  label: key,
  type: "TEXT",
  unit: null,
  options: [],
  scope: "PRODUCT",
  required: false,
  sortOrder: 0,
  ...extra,
});

describe("effectiveAttributes", () => {
  const categories = [
    { id: "root", parentId: null, attributes: [def("material", { sortOrder: 0 })] },
    { id: "child", parentId: "root", attributes: [def("diameterCm", { sortOrder: 1 }), def("material", { label: "Body" })] },
  ];

  it("includes ancestor attributes, child definitions winning on key clashes", () => {
    const attrs = effectiveAttributes("child", categories);
    expect(attrs.map((a) => [a.key, a.label])).toEqual([
      ["material", "Body"],
      ["diameterCm", "diameterCm"],
    ]);
  });

  it("returns nothing without a category", () => {
    expect(effectiveAttributes(null, categories)).toEqual([]);
  });

  it("survives a parent cycle", () => {
    const cyclic = [
      { id: "a", parentId: "b", attributes: [def("x")] },
      { id: "b", parentId: "a", attributes: [def("y")] },
    ];
    expect(effectiveAttributes("a", cyclic).map((a) => a.key).sort()).toEqual(["x", "y"]);
  });
});

describe("validateAttributeValues", () => {
  const defs = [
    def("diameterCm", { type: "NUMBER", required: true }),
    def("finish", { type: "SELECT", options: ["Matte", "Gloss"] }),
    def("dishwasherSafe", { type: "BOOLEAN" }),
    def("note"),
  ];

  it("coerces numbers and booleans and drops empty optional values", () => {
    expect(validateAttributeValues(defs, { diameterCm: "12.5", dishwasherSafe: "true", note: "", extra: "x" })).toEqual({
      ok: true,
      values: { diameterCm: 12.5, dishwasherSafe: true },
    });
  });

  it("reports missing required and invalid values by key", () => {
    expect(validateAttributeValues(defs, { finish: "Shiny" })).toEqual({
      ok: false,
      errors: { diameterCm: "Diameter cm is required", finish: "Choose one of: Matte, Gloss" },
    });
    expect(validateAttributeValues(defs, { diameterCm: "abc" })).toEqual({
      ok: false,
      errors: { diameterCm: "Must be a number" },
    });
  });
});
