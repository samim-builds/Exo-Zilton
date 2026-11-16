import type { FieldDescriptor } from "./sections";
import type { SettingKey } from "./settings";

// Admin form layout for each settings group (the generic FieldEditor renders them).

const navLinkFields: FieldDescriptor[] = [
  { key: "label", label: "Label", kind: "text" },
  { key: "href", label: "Link", kind: "url" },
];

export const SETTING_GROUPS: Record<SettingKey, { label: string; description: string; fields: FieldDescriptor[] }> = {
  contact: {
    label: "Store details",
    description: "Shown in the header, footer and content pages. Page copy can insert these with {{contactEmail}} and similar.",
    fields: [
      { key: "siteName", label: "Store name", kind: "text" },
      { key: "tagline", label: "Tagline", kind: "text" },
      { key: "description", label: "Footer description", kind: "textarea" },
      { key: "contactEmail", label: "Contact email", kind: "text" },
      { key: "instagramHandle", label: "Instagram handle", kind: "text" },
      { key: "location", label: "Location", kind: "text" },
      { key: "foundingYear", label: "Founded", kind: "text" },
    ],
  },
  navigation: {
    label: "Navigation",
    description: "Links in the header menu and the footer.",
    fields: [
      { key: "header", label: "Header menu", kind: "list", itemLabel: "Link", fields: navLinkFields },
      { key: "footer", label: "Footer links", kind: "list", itemLabel: "Link", fields: navLinkFields },
    ],
  },
  announcement: {
    label: "Announcement bar",
    description: "A slim bar above the header on every storefront page.",
    fields: [
      { key: "enabled", label: "Show the bar", kind: "boolean" },
      { key: "text", label: "Message", kind: "text" },
      { key: "linkLabel", label: "Link label (optional)", kind: "text" },
      { key: "href", label: "Link (optional)", kind: "url" },
    ],
  },
  welcomeOffer: {
    label: "Welcome offer",
    description: "A popup for new visitors. Signing up issues a one-time code for a first order (checked by email and phone).",
    fields: [
      { key: "enabled", label: "Show the popup", kind: "boolean" },
      { key: "percentOff", label: "Discount (%)", kind: "number" },
      { key: "minSubtotalPKR", label: "Minimum order, PKR (0 for none)", kind: "number" },
      { key: "minSubtotalUSD", label: "Minimum order, USD (0 for none)", kind: "number" },
      { key: "expiryDays", label: "Code valid for (days, 0 = no expiry)", kind: "number" },
      { key: "delaySeconds", label: "Show after (seconds on the site)", kind: "number" },
      { key: "title", label: "Popup heading", kind: "text" },
      { key: "body", label: "Popup text", kind: "textarea" },
      { key: "buttonLabel", label: "Button label", kind: "text" },
      { key: "successTitle", label: "Heading after sign-up", kind: "text" },
      { key: "successBody", label: "Text after sign-up", kind: "textarea" },
    ],
  },
};
