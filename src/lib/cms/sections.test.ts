import { describe, expect, it } from "vitest";
import { DEFAULT_PAGES, SECTION_TYPES, interpolate, interpolateSection, parseSections, sectionDefaults } from "./sections";

describe("section registry", () => {
  it.each(Object.keys(SECTION_TYPES))("%s accepts its own defaults", (type) => {
    const def = SECTION_TYPES[type as keyof typeof SECTION_TYPES];
    expect(def.schema.safeParse(def.defaults).success).toBe(true);
  });

  it.each(Object.entries(DEFAULT_PAGES))("default %s page sections are all valid", (_slug, page) => {
    expect(parseSections(page.sections)).toHaveLength(page.sections.length);
  });

  it("gives every field descriptor a key the schema knows", () => {
    for (const [type, def] of Object.entries(SECTION_TYPES)) {
      const keys = Object.keys(def.defaults as object);
      for (const field of def.fields) expect(keys, `${type}.${field.key}`).toContain(field.key);
    }
  });
});

describe("parseSections", () => {
  it("drops unknown types and malformed entries", () => {
    expect(
      parseSections([
        { id: "a", type: "nope", visible: true, data: {} },
        "garbage",
        { id: "b", type: "trust-bar", visible: true, data: sectionDefaults("trust-bar") },
      ]).map((s) => s.id),
    ).toEqual(["b"]);
  });

  it("drops sections whose data no longer matches the schema", () => {
    expect(parseSections([{ id: "a", type: "trust-bar", visible: true, data: { items: "x" } }])).toEqual([]);
  });

  it("returns an empty list for non-arrays", () => {
    expect(parseSections(null)).toEqual([]);
  });
});

describe("interpolate", () => {
  it("fills {{tokens}} from settings and leaves unknown ones", () => {
    expect(interpolate("Email {{contactEmail}} since {{foundingYear}} {{nope}}", { contactEmail: "a@b.c", foundingYear: "2024" })).toBe(
      "Email a@b.c since 2024 {{nope}}",
    );
  });
});

describe("interpolateSection", () => {
  it("fills tokens in every nested string of a section", () => {
    const s = parseSections(DEFAULT_PAGES.terms.sections)[0];
    const out = interpolateSection(s, { siteName: "Acme", contactEmail: "x@y.z" });
    const json = JSON.stringify(out.data);
    expect(json).toContain("x@y.z");
    expect(json).toContain("the Acme website");
    expect(json).not.toContain("{{");
  });
});

describe("instagram-feed posts", () => {
  it("fills the default posts into a section saved before posts were editable", () => {
    const [s] = parseSections([{ id: "ig", type: "instagram-feed", visible: true, data: { eyebrow: "E", title: "T" } }]);
    expect(s?.type).toBe("instagram-feed");
    const data = s!.data as { posts: { image: string }[] };
    expect(data.posts).toHaveLength(6);
    expect(data.posts[0].image).toBe("/hero/grind.webp");
  });
});
