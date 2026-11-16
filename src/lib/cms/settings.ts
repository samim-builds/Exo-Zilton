import { z } from "zod";
import { navLinks, siteConfig } from "@/lib/site";

// Admin-editable site settings, one JSON row per group. Each group is validated
// on read; a missing or invalid row falls back to the code defaults (which come
// from siteConfig / env), so the storefront never breaks on bad data. Client-safe.

const text = z.string().max(2000);
const navLink = z.object({ label: text.min(1), href: text.min(1) });

export const settingSchemas = {
  contact: z.object({
    siteName: text.min(1),
    tagline: text,
    description: text,
    contactEmail: z.email(),
    instagramHandle: text,
    location: text,
    foundingYear: text,
  }),
  navigation: z.object({
    header: z.array(navLink).max(10),
    footer: z.array(navLink).max(12),
  }),
  announcement: z.object({
    enabled: z.boolean(),
    text: text,
    href: text,
    linkLabel: text,
  }),
  welcomeOffer: z.object({
    enabled: z.boolean(),
    percentOff: z.number().int().min(1).max(90),
    minSubtotalPKR: z.number().int().min(0).nullable(),
    minSubtotalUSD: z.number().int().min(0).nullable(),
    expiryDays: z.number().int().min(0).max(365),
    delaySeconds: z.number().int().min(0).max(300),
    title: text.min(1),
    body: text,
    buttonLabel: text.min(1),
    successTitle: text,
    successBody: text,
  }),
};

export type SettingKey = keyof typeof settingSchemas;
export type SiteSettings = { [K in SettingKey]: z.infer<(typeof settingSchemas)[K]> };

export const SETTING_DEFAULTS: SiteSettings = {
  contact: {
    siteName: siteConfig.name,
    tagline: siteConfig.tagline,
    description: siteConfig.description,
    contactEmail: siteConfig.contactEmail,
    instagramHandle: siteConfig.instagramHandle,
    location: siteConfig.location,
    foundingYear: siteConfig.foundingYear,
  },
  navigation: {
    header: navLinks.map((l) => ({ label: l.label, href: l.href })),
    footer: [
      ...navLinks.map((l) => ({ label: l.label, href: l.href })),
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
  announcement: { enabled: false, text: "", href: "", linkLabel: "" },
  welcomeOffer: {
    enabled: false,
    percentOff: 10,
    minSubtotalPKR: null,
    minSubtotalUSD: null,
    expiryDays: 30,
    delaySeconds: 8,
    title: "10% off your first order",
    body: "Join the Exo Zilton list for kitchen notes and new releases, and we'll send you a one-time code for your first order.",
    buttonLabel: "Get my code",
    successTitle: "Your code is ready",
    successBody: "Use it at checkout on your first order. We've emailed it to you too.",
  },
};

export const SETTING_KEYS = Object.keys(settingSchemas) as SettingKey[];

export function isSettingKey(key: unknown): key is SettingKey {
  return typeof key === "string" && Object.hasOwn(settingSchemas, key);
}

export function resolveSettings(rows: { key: string; value: unknown }[]): SiteSettings {
  const settings = structuredClone(SETTING_DEFAULTS);
  for (const row of rows) {
    if (!isSettingKey(row.key) || !row.value || typeof row.value !== "object") continue;
    const parsed = settingSchemas[row.key].safeParse({ ...SETTING_DEFAULTS[row.key], ...row.value });
    if (parsed.success) (settings as Record<SettingKey, unknown>)[row.key] = parsed.data;
  }
  return settings;
}

/** Values available to page copy as {{token}}. */
export function settingsTokens(settings: SiteSettings): Record<string, string> {
  const c = settings.contact;
  return {
    siteName: c.siteName,
    contactEmail: c.contactEmail,
    location: c.location,
    foundingYear: c.foundingYear,
    instagramHandle: c.instagramHandle.replace(/^@/, ""),
  };
}

export function instagramUrl(handle: string): string {
  return `https://www.instagram.com/${handle.replace(/^@/, "")}/`;
}
