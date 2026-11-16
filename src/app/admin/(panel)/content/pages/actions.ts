"use server";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { isUniqueViolation } from "@/lib/catalog/mutations";
import { PAGES_TAG, pageTag } from "@/lib/cms/server";
import { pageSlugSchema, validateSections } from "@/lib/cms/pages";
import { DEFAULT_PAGES } from "@/lib/cms/sections";

const isSystem = (slug: string) => Object.hasOwn(DEFAULT_PAGES, slug);

const slugRef = z.object({ slug: z.string().min(1).max(80) });

const pageInput = slugRef.extend({
  title: z.string().trim().min(1, "Required").max(200),
  seoTitle: z.string().trim().max(200),
  seoDescription: z.string().trim().max(500),
  ogImageUrl: z.string().trim().max(1000),
  sections: z.array(z.unknown()).max(60),
});

function checkedSections(raw: unknown[]) {
  const result = validateSections(raw);
  if (!result.ok) throw new AdminActionError(result.error);
  return result.sections;
}

async function ensureExists(slug: string) {
  if (isSystem(slug)) return;
  const found = await prisma.page.count({ where: { slug } });
  if (!found) throw new AdminActionError("This page no longer exists.");
}

const meta = (input: z.infer<typeof pageInput>) => ({
  title: input.title,
  seoTitle: input.seoTitle || null,
  seoDescription: input.seoDescription || null,
  ogImageUrl: input.ogImageUrl || null,
});

const pageRevalidate = (slug: string) => [PAGES_TAG, pageTag(slug)];

export const savePageDraft = adminAction(
  pageInput,
  async (input) => {
    const sections = checkedSections(input.sections);
    await ensureExists(input.slug);
    await prisma.page.upsert({
      where: { slug: input.slug },
      create: { slug: input.slug, isSystem: true, status: "DRAFT", ...meta(input), draftSections: sections },
      update: { ...meta(input), draftSections: sections },
    });
    await logActivity({ entityType: "page", entityId: input.slug, action: "UPDATE", summary: `Saved a draft of ${input.title}` });
    return { slug: input.slug };
  },
  { tags: (i) => pageRevalidate(i.slug), paths: ["/admin/content/pages"] },
);

export const publishPage = adminAction(
  pageInput,
  async (input) => {
    const sections = checkedSections(input.sections);
    await ensureExists(input.slug);
    const data = { ...meta(input), sections, draftSections: Prisma.DbNull, status: "PUBLISHED" as const, publishedAt: new Date() };
    await prisma.page.upsert({
      where: { slug: input.slug },
      create: { slug: input.slug, isSystem: true, ...data },
      update: data,
    });
    await logActivity({ entityType: "page", entityId: input.slug, action: "PUBLISH", summary: `Published ${input.title}` });
    return { slug: input.slug };
  },
  // Layout-wide: the homepage banner also appears on product pages.
  { tags: (i) => pageRevalidate(i.slug), paths: ["/admin/content/pages"], site: true },
);

export const discardPageDraft = adminAction(
  slugRef,
  async ({ slug }) => {
    await prisma.page.updateMany({ where: { slug }, data: { draftSections: Prisma.DbNull } });
    await logActivity({ entityType: "page", entityId: slug, action: "UPDATE", summary: `Discarded the draft of ${slug}` });
    return { slug };
  },
  { tags: (i) => pageRevalidate(i.slug), paths: ["/admin/content/pages"] },
);

export const createPage = adminAction(
  z.object({ title: z.string().trim().min(1, "Required").max(200), slug: pageSlugSchema }),
  async ({ title, slug }) => {
    try {
      await prisma.page.create({
        data: {
          slug,
          title,
          status: "DRAFT",
          sections: [],
          draftSections: [{ id: `s-${Date.now().toString(36)}`, type: "page-heading", visible: true, data: { eyebrow: "", title, description: "" } }],
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new AdminActionError(`A page at /${slug} already exists.`);
      throw error;
    }
    await logActivity({ entityType: "page", entityId: slug, action: "CREATE", summary: `Created page ${title}` });
    return { slug };
  },
  { paths: ["/admin/content/pages"] },
);

export const setPageStatus = adminAction(
  slugRef.extend({ status: z.enum(["DRAFT", "PUBLISHED"]) }),
  async ({ slug, status }) => {
    if (isSystem(slug)) throw new AdminActionError("System pages are always live. Publish changes instead.");
    const page = await prisma.page.findUnique({ where: { slug }, select: { sections: true, draftSections: true } });
    if (!page) throw new AdminActionError("This page no longer exists.");
    await prisma.page.update({ where: { slug }, data: { status, ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}) } });
    await logActivity({ entityType: "page", entityId: slug, action: "STATUS", summary: `${status === "PUBLISHED" ? "Published" : "Unpublished"} /${slug}` });
    return { slug };
  },
  { tags: (i) => pageRevalidate(i.slug), paths: ["/admin/content/pages", "/sitemap.xml"] },
);

export const deletePage = adminAction(
  slugRef,
  async ({ slug }) => {
    if (isSystem(slug)) throw new AdminActionError("System pages can't be deleted.");
    await prisma.page.deleteMany({ where: { slug } });
    await logActivity({ entityType: "page", entityId: slug, action: "DELETE", summary: `Deleted page /${slug}` });
    return { slug };
  },
  { tags: (i) => pageRevalidate(i.slug), paths: ["/admin/content/pages"] },
);
