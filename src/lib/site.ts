export const siteConfig = {
  name: "Exo Zilton",
  tagline: "Mortar & Pestle",
  description:
    "Premium unglazed porcelain mortar and pestle sets with beechwood handles. Crafted for home chefs and professionals across Pakistan and worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://exozilton.com",
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "923001234567",
  contactEmail: process.env.CONTACT_EMAIL ?? "hello@exozilton.com",
  location: "Pakistan",
  foundingYear: "2024",
  instagramHandle:
    process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE ?? "exozilton",
  elfsightWidgetId: process.env.NEXT_PUBLIC_ELFSIGHT_INSTAGRAM_WIDGET_ID ?? "",
};

export function getInstagramUrl(): string {
  return `https://www.instagram.com/${siteConfig.instagramHandle.replace(/^@/, "")}/`;
}

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;
