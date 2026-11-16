import "server-only";
import { unstable_cache } from "next/cache";
import { draftMode } from "next/headers";
import { prisma } from "@/lib/db";
import { DEFAULT_PAGES, interpolateSection, parseSections, type SectionInstance } from "./sections";
import { resolveSettings, settingsTokens, type SiteSettings, SETTING_DEFAULTS } from "./settings";

// Storefront CMS reads. Published content is cached under "cms" tags that the
// admin actions invalidate; draft mode (admin preview) reads straight from the DB.

export const SETTINGS_TAG = "cms:settings";
export const pageTag = (slug: string) => `cms:page:${slug}`;
export const PAGES_TAG = "cms:pages";

const cachedSettings = unstable_cache(
  async () => resolveSettings(await prisma.siteSetting.findMany({ select: { key: true, value: true } })),
  ["cms-settings"],
  { tags: [SETTINGS_TAG], revalidate: 300 },
);

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!process.env.DATABASE_URL) return SETTING_DEFAULTS;
  try {
    return await cachedSettings();
  } catch {
    return SETTING_DEFAULTS;
  }
}

export type ResolvedPage = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string | null;
  sections: SectionInstance[];
  draft: boolean;
};

type PageRow = {
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  sections: unknown;
  draftSections: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
};

const pageSelect = {
  slug: true,
  title: true,
  status: true,
  sections: true,
  draftSections: true,
  seoTitle: true,
  seoDescription: true,
  ogImageUrl: true,
} as const;

function readPageRow(slug: string): Promise<PageRow | null> {
  return prisma.page.findUnique({ where: { slug }, select: pageSelect });
}

function cachedPageRow(slug: string) {
  return unstable_cache(() => readPageRow(slug), ["cms-page", slug], { tags: [PAGES_TAG, pageTag(slug)], revalidate: 300 })();
}

async function loadRow(slug: string, draft: boolean): Promise<PageRow | null> {
  if (!process.env.DATABASE_URL) return null;
  try {
    return draft ? await readPageRow(slug) : await cachedPageRow(slug);
  } catch {
    return null;
  }
}

/**
 * A page ready to render, with {{tokens}} filled from settings. System pages fall
 * back to their code defaults until published; custom pages exist only in the DB.
 */
export async function getPage(slug: string): Promise<ResolvedPage | null> {
  const draft = (await draftMode()).isEnabled;
  const [row, settings] = await Promise.all([loadRow(slug, draft), getSiteSettings()]);
  const fallback = Object.hasOwn(DEFAULT_PAGES, slug) ? DEFAULT_PAGES[slug as keyof typeof DEFAULT_PAGES] : null;

  let page: ResolvedPage | null = null;
  if (row && (row.status === "PUBLISHED" || draft)) {
    const raw = draft && row.draftSections != null ? row.draftSections : row.status === "PUBLISHED" ? row.sections : row.draftSections ?? row.sections;
    page = {
      slug,
      title: row.title,
      seoTitle: row.seoTitle ?? "",
      seoDescription: row.seoDescription ?? "",
      ogImageUrl: row.ogImageUrl,
      sections: parseSections(raw),
      draft,
    };
  } else if (fallback) {
    page = { slug, ...fallback, ogImageUrl: null, draft };
  }
  if (!page) return null;

  const tokens = settingsTokens(settings);
  return { ...page, sections: page.sections.map((s) => interpolateSection(s, tokens)) };
}

/** Published custom pages, for the sitemap. */
export async function getPublishedPageSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await prisma.page.findMany({ where: { status: "PUBLISHED", isSystem: false }, select: { slug: true, updatedAt: true } });
  } catch {
    return [];
  }
}
