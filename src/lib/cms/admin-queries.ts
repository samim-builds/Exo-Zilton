import "server-only";
import { prisma } from "@/lib/db";
import { DEFAULT_PAGES, parseSections, type SectionInstance, type SystemPageSlug } from "./sections";
import { resolveSettings, type SiteSettings } from "./settings";

export type PageListRow = {
  slug: string;
  title: string;
  isSystem: boolean;
  status: "DRAFT" | "PUBLISHED" | "DEFAULT";
  hasDraft: boolean;
  updatedAt: string | null;
};

export const pagePath = (slug: string) => (slug === "home" ? "/" : `/${slug}`);

/** System pages always appear, even before they have a database row. */
export async function listPages(): Promise<PageListRow[]> {
  const rows = process.env.DATABASE_URL
    ? await prisma.page.findMany({
        select: { slug: true, title: true, isSystem: true, status: true, draftSections: true, updatedAt: true },
        orderBy: [{ isSystem: "desc" }, { title: "asc" }],
      })
    : [];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const system: PageListRow[] = (Object.keys(DEFAULT_PAGES) as SystemPageSlug[]).map((slug) => {
    const row = bySlug.get(slug);
    return {
      slug,
      title: row?.title ?? DEFAULT_PAGES[slug].title,
      isSystem: true,
      status: row?.status === "PUBLISHED" ? "PUBLISHED" : "DEFAULT",
      hasDraft: row?.draftSections != null,
      updatedAt: row?.updatedAt.toISOString() ?? null,
    };
  });
  const custom: PageListRow[] = rows
    .filter((r) => !Object.hasOwn(DEFAULT_PAGES, r.slug))
    .map((r) => ({
      slug: r.slug,
      title: r.title,
      isSystem: false,
      status: r.status,
      hasDraft: r.draftSections != null,
      updatedAt: r.updatedAt.toISOString(),
    }));
  return [...system, ...custom];
}

export type PageForEdit = {
  slug: string;
  title: string;
  isSystem: boolean;
  status: "DRAFT" | "PUBLISHED" | "DEFAULT";
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  sections: SectionInstance[];
  hasDraft: boolean;
};

export async function getPageForEdit(slug: string): Promise<PageForEdit | null> {
  const row = process.env.DATABASE_URL ? await prisma.page.findUnique({ where: { slug } }) : null;
  const fallback = Object.hasOwn(DEFAULT_PAGES, slug) ? DEFAULT_PAGES[slug as SystemPageSlug] : null;
  if (!row) {
    if (!fallback) return null;
    return {
      slug,
      title: fallback.title,
      isSystem: true,
      status: "DEFAULT",
      seoTitle: fallback.seoTitle,
      seoDescription: fallback.seoDescription,
      ogImageUrl: "",
      sections: fallback.sections,
      hasDraft: false,
    };
  }
  const publishedSections = row.status === "PUBLISHED" ? row.sections : fallback ? fallback.sections : row.sections;
  return {
    slug,
    title: row.title,
    isSystem: Boolean(fallback),
    status: row.status === "PUBLISHED" ? "PUBLISHED" : fallback ? "DEFAULT" : "DRAFT",
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    ogImageUrl: row.ogImageUrl ?? "",
    sections: parseSections(row.draftSections ?? publishedSections),
    hasDraft: row.draftSections != null,
  };
}

export async function getSettingsForEdit(): Promise<SiteSettings> {
  const rows = process.env.DATABASE_URL ? await prisma.siteSetting.findMany({ select: { key: true, value: true } }) : [];
  return resolveSettings(rows);
}

export type SubscriberRow = { id: string; email: string; source: string; code: string | null; codeUsed: boolean; createdAt: string };

export async function listSubscribers({ skip, take, q }: { skip: number; take: number; q?: string }) {
  const where = q ? { email: { contains: q, mode: "insensitive" as const } } : {};
  const [rows, total] = await Promise.all([
    prisma.subscriber.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.subscriber.count({ where }),
  ]);
  const discounts = await prisma.discount.findMany({
    where: { id: { in: rows.flatMap((r) => (r.welcomeDiscountId ? [r.welcomeDiscountId] : [])) } },
    select: { id: true, code: true, usedCount: true },
  });
  const byId = new Map(discounts.map((d) => [d.id, d]));
  return {
    total,
    rows: rows.map(
      (r): SubscriberRow => ({
        id: r.id,
        email: r.email,
        source: r.source,
        code: (r.welcomeDiscountId && byId.get(r.welcomeDiscountId)?.code) || null,
        codeUsed: Boolean(r.welcomeDiscountId && (byId.get(r.welcomeDiscountId)?.usedCount ?? 0) > 0),
        createdAt: r.createdAt.toISOString(),
      }),
    ),
  };
}
