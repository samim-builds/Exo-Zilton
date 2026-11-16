import { z } from "zod";
import { DEFAULT_PAGES, SECTION_TYPES, isSectionType, type SectionInstance } from "./sections";

// Validation for admin page edits. Client-safe.

/** First path segments the storefront or framework already uses. */
const RESERVED_SLUGS = new Set([
  ...Object.keys(DEFAULT_PAGES),
  "products",
  "categories",
  "cart",
  "checkout",
  "contact",
  "orders",
  "admin",
  "api",
  "sitemap.xml",
  "robots.txt",
  "_next",
]);

export const pageSlugSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only")
  .refine((slug) => !RESERVED_SLUGS.has(slug), "This address is already used by the site");

export type SectionsValidation = { ok: true; sections: SectionInstance[] } | { ok: false; index: number; error: string };

/** Strict counterpart of parseSections: rejects the whole save and says which section is wrong. */
export function validateSections(raw: unknown[]): SectionsValidation {
  const seen = new Set<string>();
  const sections: SectionInstance[] = [];
  for (const [index, entry] of raw.entries()) {
    const e = entry as { id?: unknown; type?: unknown; visible?: unknown; data?: unknown } | null;
    if (!e || typeof e.id !== "string" || !e.id || !isSectionType(e.type)) {
      return { ok: false, index, error: `Section ${index + 1} is not a known section type.` };
    }
    if (seen.has(e.id)) return { ok: false, index, error: `Section ${index + 1} is a duplicate.` };
    seen.add(e.id);
    const def = SECTION_TYPES[e.type];
    const parsed = def.schema.safeParse(e.data);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const where = issue?.path.length ? ` (${issue.path.join(" › ")})` : "";
      return { ok: false, index, error: `${def.label} (section ${index + 1})${where}: ${issue?.message ?? "invalid"}` };
    }
    sections.push({ id: e.id, type: e.type, visible: e.visible !== false, data: parsed.data } as SectionInstance);
  }
  return { ok: true, sections };
}
