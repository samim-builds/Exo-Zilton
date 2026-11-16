import { describe, expect, it } from "vitest";
import { pageSlugSchema, validateSections } from "./pages";
import { sectionDefaults } from "./sections";

describe("pageSlugSchema", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(pageSlugSchema.safeParse("wholesale-enquiries").success).toBe(true);
  });

  it.each(["Bad Slug", "-lead", "a/b", ""])("rejects malformed slug %j", (slug) => {
    expect(pageSlugSchema.safeParse(slug).success).toBe(false);
  });

  it.each(["products", "cart", "admin", "api", "home", "about", "categories"])("rejects reserved slug %s", (slug) => {
    expect(pageSlugSchema.safeParse(slug).success).toBe(false);
  });
});

describe("validateSections", () => {
  const good = { id: "a", type: "trust-bar", visible: true, data: sectionDefaults("trust-bar") };

  it("returns the parsed sections when all are valid", () => {
    const r = validateSections([good]);
    expect(r.ok && r.sections.map((s) => s.id)).toEqual(["a"]);
  });

  it("names the section that fails instead of silently dropping it", () => {
    const r = validateSections([good, { id: "b", type: "trust-bar", visible: true, data: { items: "x" } }]);
    expect(r).toMatchObject({ ok: false, index: 1 });
    expect(!r.ok && r.error).toContain("Trust bar");
  });

  it("rejects unknown section types", () => {
    expect(validateSections([{ id: "c", type: "nope", visible: true, data: {} }])).toMatchObject({ ok: false, index: 0 });
  });

  it("rejects duplicate section ids", () => {
    expect(validateSections([good, good])).toMatchObject({ ok: false, index: 1 });
  });
});
