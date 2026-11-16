import { z } from "zod";

// The section registry: every block a CMS page can contain, with its data
// schema, the defaults that reproduce the site as it was hand-coded, and field
// descriptors that drive the generic admin editor. Client-safe.

export type FieldDescriptor =
  | { key: string; label: string; kind: "text" | "textarea" | "image" | "url"; help?: string }
  | { key: string; label: string; kind: "number"; help?: string }
  | { key: string; label: string; kind: "boolean"; help?: string }
  | { key: string; label: string; kind: "select"; options: { value: string; label: string }[]; help?: string }
  | { key: string; label: string; kind: "strings"; help?: string }
  | { key: string; label: string; kind: "link"; help?: string }
  | { key: string; label: string; kind: "list"; itemLabel: string; fields: FieldDescriptor[]; help?: string };

const text = z.string().max(2000);
const longText = z.string().max(20000);
const link = z.object({ label: text, href: text });

const heroSchema = z.object({
  eyebrow: text,
  title: text,
  titleAccent: text,
  body: longText,
  primaryCta: link,
  secondaryCta: link,
  slides: z.array(z.object({ image: text, alt: text })).min(1).max(8),
});

const trustBarSchema = z.object({ items: z.array(z.object({ label: text, description: text })).max(6) });

const productRailSchema = z.object({
  eyebrow: text,
  title: text,
  description: longText,
  ctaLabel: text,
  ctaHref: text,
  source: z.enum(["all", "category"]),
  categorySlug: text,
  limit: z.number().int().min(1).max(12),
});

const featureGridSchema = z.object({
  eyebrow: text,
  title: text,
  description: longText,
  items: z.array(z.object({ title: text, description: longText })).max(8),
});

const scrollStorySchema = z.object({
  eyebrow: text,
  title: text,
  image: text,
  imageAlt: text,
  badgeLeft: text,
  badgeRight: text,
  pillars: z.array(z.object({ step: text, tag: text, title: text, body: longText })).max(6),
});

const comparisonSchema = z.object({
  anchor: text,
  eyebrow: text,
  title: text,
  intro: longText,
  columns: z.array(text).min(1).max(4),
  rows: z.array(z.object({ label: text, cells: z.array(longText) })).max(10),
});

const brandBannerSchema = z.object({ eyebrow: text, title: text, body: longText, ctaLabel: text, ctaHref: text });

const instagramSchema = z.object({ eyebrow: text, title: text });

const pageHeadingSchema = z.object({ eyebrow: text, title: text, description: longText });

const imageTextSchema = z.object({
  image: text,
  imageAlt: text,
  imageSide: z.enum(["left", "right"]),
  imageFit: z.enum(["cover", "contain"]),
  heading: text,
  body: longText,
});

const richTextSchema = z.object({
  title: text,
  blocks: z.array(z.object({ heading: text, body: longText, bullets: z.array(longText) })).max(30),
});

const faqSchema = z.object({ eyebrow: text, title: text, items: z.array(z.object({ question: text, answer: longText })).max(30) });

export const SECTION_TYPES = {
  "hero-carousel": {
    label: "Hero carousel",
    schema: heroSchema,
    defaults: {
      eyebrow: "01 — Unglazed vitrified porcelain",
      title: "Pure Flavour.",
      titleAccent: "Zero Staining. Zero Odours.",
      body: "Engineered from vitrified unglazed porcelain, designed to grind without retaining previous flavours. An indestructible culinary tool for life.",
      primaryCta: { label: "Explore collection", href: "/products" },
      secondaryCta: { label: "Why Porcelain? →", href: "/#why-porcelain" },
      slides: [
        { image: "/hero/grind.webp", alt: "Unglazed porcelain mortar and pestle with whole spices on stone" },
        { image: "/hero/crush.webp", alt: "Pestle grinding spices in an unglazed porcelain mortar" },
        { image: "/hero/craft.webp", alt: "Porcelain mortars arranged with spices, citrus, and rosemary" },
      ],
    } satisfies z.infer<typeof heroSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Headline", kind: "text" },
      { key: "titleAccent", label: "Headline second line (italic)", kind: "text" },
      { key: "body", label: "Intro", kind: "textarea" },
      { key: "primaryCta", label: "Primary button", kind: "link" },
      { key: "secondaryCta", label: "Secondary link", kind: "link" },
      {
        key: "slides",
        label: "Slides",
        kind: "list",
        itemLabel: "Slide",
        fields: [
          { key: "image", label: "Image", kind: "image" },
          { key: "alt", label: "Alt text", kind: "text" },
        ],
      },
    ] as FieldDescriptor[],
  },
  "trust-bar": {
    label: "Trust bar",
    schema: trustBarSchema,
    defaults: {
      items: [
        { label: "Made in Pakistan", description: "Proudly crafted with care" },
        { label: "Quality Guarantee", description: "Built to last for years" },
        { label: "Worldwide Inquiries", description: "Ship across Pakistan & abroad" },
      ],
    } satisfies z.infer<typeof trustBarSchema>,
    fields: [
      {
        key: "items",
        label: "Items",
        kind: "list",
        itemLabel: "Item",
        fields: [
          { key: "label", label: "Label", kind: "text" },
          { key: "description", label: "Description", kind: "text" },
        ],
      },
    ] as FieldDescriptor[],
  },
  "product-rail": {
    label: "Product rail",
    schema: productRailSchema,
    defaults: {
      eyebrow: "Shop",
      title: "Mortar & Pestle Collection",
      description: "Available in multiple sizes to suit every kitchen — from compact daily use to professional grinding.",
      ctaLabel: "View All",
      ctaHref: "/products",
      source: "all",
      categorySlug: "",
      limit: 4,
    } satisfies z.infer<typeof productRailSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      {
        key: "source",
        label: "Products to show",
        kind: "select",
        options: [
          { value: "all", label: "All in-stock products (featured first)" },
          { value: "category", label: "One category" },
        ],
      },
      { key: "categorySlug", label: "Category slug (when showing one category)", kind: "text" },
      { key: "limit", label: "How many", kind: "number" },
      { key: "ctaLabel", label: "Button label", kind: "text" },
      { key: "ctaHref", label: "Button link", kind: "url" },
    ] as FieldDescriptor[],
  },
  "feature-grid": {
    label: "Feature grid",
    schema: featureGridSchema,
    defaults: {
      eyebrow: "Why Exo Zilton",
      title: "Craftsmanship You Can Trust",
      description: "Every mortar and pestle is designed to maximise flavour, durability, and timeless kitchen elegance.",
      items: [
        {
          title: "Vitrified Porcelain",
          description: "Dense unglazed porcelain provides the perfect abrasive finish for blending herbs and spices without staining.",
        },
        {
          title: "Beechwood Handle",
          description: "Ergonomic beechwood handle offers comfortable grip and control when grinding even the toughest mixtures.",
        },
        {
          title: "Gift-Ready Packaging",
          description: "Each set arrives in beautiful kraft packaging — perfect for weddings, housewarmings, and special occasions.",
        },
        {
          title: "Worldwide Shipping",
          description: "Based in Pakistan with delivery across the country and international inquiries welcome via WhatsApp.",
        },
      ],
    } satisfies z.infer<typeof featureGridSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
      {
        key: "items",
        label: "Features",
        kind: "list",
        itemLabel: "Feature",
        fields: [
          { key: "title", label: "Title", kind: "text" },
          { key: "description", label: "Description", kind: "textarea" },
        ],
      },
    ] as FieldDescriptor[],
  },
  "scroll-story": {
    label: "Scroll story",
    schema: scrollStorySchema,
    defaults: {
      eyebrow: "Engineering & Craft",
      title: "The Anatomy of Pure Grinding",
      image: "/hero/grind.webp",
      imageAlt: "Exo Zilton Vitrified Porcelain Anatomy",
      badgeLeft: "Vitrified Bisque Porcelain",
      badgeRight: "Fired at 1,300°C",
      pillars: [
        {
          step: "01",
          tag: "MOLECULAR DENSITY",
          title: "Fired at 1,300°C for Absolute Vitrification",
          body: "At peak kiln temperatures, porcelain clay fusions into a dense, non-porous glass structure. Unlike granite or marble, it will never absorb garlic essential oils, vinegar, or turmeric stains.",
        },
        {
          step: "02",
          tag: "TEXTURE & TOOTH",
          title: "Matte Bisque Interior for Pure Shearing Power",
          body: "Glazed bowls cause whole spices to skate and bounce. Our unglazed interior provides the precise micro-abrasive tooth needed to crush hard peppercorns into fine powders and emulsify smooth pesto pastes.",
        },
        {
          step: "03",
          tag: "TACTILE BALANCE",
          title: "Ergonomic Turned Beechwood Grip",
          body: "A hybrid design that marries the heavy downward inertia of dense porcelain with the warmth and leverage of natural European beechwood. Reduces wrist fatigue during extended culinary prep.",
        },
      ],
    } satisfies z.infer<typeof scrollStorySchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "image", label: "Image", kind: "image" },
      { key: "imageAlt", label: "Image alt text", kind: "text" },
      { key: "badgeLeft", label: "Image caption (left)", kind: "text" },
      { key: "badgeRight", label: "Image caption (right)", kind: "text" },
      {
        key: "pillars",
        label: "Story steps",
        kind: "list",
        itemLabel: "Step",
        fields: [
          { key: "step", label: "Number", kind: "text" },
          { key: "tag", label: "Tag", kind: "text" },
          { key: "title", label: "Title", kind: "text" },
          { key: "body", label: "Text", kind: "textarea" },
        ],
      },
    ] as FieldDescriptor[],
  },
  "material-comparison": {
    label: "Comparison table",
    schema: comparisonSchema,
    defaults: {
      anchor: "why-porcelain",
      eyebrow: "Material notes",
      title: "Porcelain, stone, and the European import",
      intro: "A short comparison of the bowl in the hand: what it keeps, what it grinds, and how it arrives.",
      columns: ["Porcelain", "Stone", "European heritage imports"],
      rows: [
        {
          label: "Surface",
          cells: [
            "Unglazed vitrified porcelain. It does not hold stain or the odour of the last spice.",
            "Open stone can keep oils and colour from one grind to the next.",
            "A glazed bowl stays pale, and the pestle can slip across a polished wall.",
          ],
        },
        {
          label: "Grind",
          cells: [
            "A dense, lightly abrasive finish for herbs, spices, and pastes.",
            "Grain varies with the quarry. Many bowls grind coarser than the cook intends.",
            "Smooth heritage ware asks for more force and still leaves whole seeds.",
          ],
        },
        {
          label: "Handle",
          cells: [
            "Beechwood, shaped for a steady grip on a long grind.",
            "Usually cut from the same block as the bowl.",
            "Wood, metal, or stone, depending on the workshop.",
          ],
        },
        {
          label: "Arrival",
          cells: [
            "Packed as a gift, ready to give.",
            "Often sent bare, or in a plain carton.",
            "Sold as open stock, with packing left to the importer.",
          ],
        },
        {
          label: "Reach",
          cells: [
            "Ships across Pakistan, and worldwide on inquiry.",
            "Usually found close to where the stone is cut.",
            "Import lead times, and duties, sit between the order and the kitchen.",
          ],
        },
      ],
    } satisfies z.infer<typeof comparisonSchema>,
    fields: [
      { key: "anchor", label: "Anchor id (for links like /#why-porcelain)", kind: "text" },
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "intro", label: "Intro", kind: "textarea" },
      { key: "columns", label: "Columns", kind: "strings" },
      {
        key: "rows",
        label: "Rows",
        kind: "list",
        itemLabel: "Row",
        fields: [
          { key: "label", label: "Label", kind: "text" },
          { key: "cells", label: "Cells (one per column)", kind: "strings" },
        ],
      },
    ] as FieldDescriptor[],
  },
  "brand-banner": {
    label: "Brand banner",
    schema: brandBannerSchema,
    defaults: {
      eyebrow: "Part of the Exo Zilton collection",
      title: "Synonymous with the Iconic Mortar & Pestle",
      body: "Exo Zilton expertly combines traditional designs and contemporary flair to create timeless pieces that take pride of place in kitchens across Pakistan and beyond. Our mortar and pestle sets offer durability, practicality, and an ageless charm to enhance any kitchen — from home cooks to professional chefs.",
      ctaLabel: "About Exo Zilton",
      ctaHref: "/about",
    } satisfies z.infer<typeof brandBannerSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "body", label: "Text", kind: "textarea" },
      { key: "ctaLabel", label: "Button label", kind: "text" },
      { key: "ctaHref", label: "Button link", kind: "url" },
    ] as FieldDescriptor[],
  },
  "instagram-feed": {
    label: "Instagram feed",
    schema: instagramSchema,
    defaults: { eyebrow: "Stay Connected", title: "Follow our Instagram journey..." } satisfies z.infer<typeof instagramSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text", help: "The handle comes from Settings → Contact." },
    ] as FieldDescriptor[],
  },
  "page-heading": {
    label: "Page heading",
    schema: pageHeadingSchema,
    defaults: { eyebrow: "", title: "Page title", description: "" } satisfies z.infer<typeof pageHeadingSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      { key: "description", label: "Description", kind: "textarea" },
    ] as FieldDescriptor[],
  },
  "image-text": {
    label: "Image and text",
    schema: imageTextSchema,
    defaults: {
      image: "/brand/logo.png",
      imageAlt: "",
      imageSide: "left",
      imageFit: "cover",
      heading: "",
      body: "",
    } satisfies z.infer<typeof imageTextSchema>,
    fields: [
      { key: "image", label: "Image", kind: "image" },
      { key: "imageAlt", label: "Image alt text", kind: "text" },
      {
        key: "imageSide",
        label: "Image side",
        kind: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "right", label: "Right" },
        ],
      },
      {
        key: "imageFit",
        label: "Image fit",
        kind: "select",
        options: [
          { value: "cover", label: "Fill the frame" },
          { value: "contain", label: "Show whole image" },
        ],
      },
      { key: "heading", label: "Heading", kind: "text" },
      { key: "body", label: "Text (blank line between paragraphs)", kind: "textarea" },
    ] as FieldDescriptor[],
  },
  "rich-text": {
    label: "Text",
    schema: richTextSchema,
    defaults: { title: "", blocks: [{ heading: "", body: "", bullets: [] }] } satisfies z.infer<typeof richTextSchema>,
    fields: [
      { key: "title", label: "Page title", kind: "text" },
      {
        key: "blocks",
        label: "Blocks",
        kind: "list",
        itemLabel: "Block",
        fields: [
          { key: "heading", label: "Heading", kind: "text" },
          { key: "body", label: "Text (blank line between paragraphs)", kind: "textarea" },
          { key: "bullets", label: "Bullet points", kind: "strings" },
        ],
      },
    ] as FieldDescriptor[],
  },
  faq: {
    label: "FAQ",
    schema: faqSchema,
    defaults: { eyebrow: "", title: "Frequently asked questions", items: [{ question: "", answer: "" }] } satisfies z.infer<typeof faqSchema>,
    fields: [
      { key: "eyebrow", label: "Eyebrow", kind: "text" },
      { key: "title", label: "Title", kind: "text" },
      {
        key: "items",
        label: "Questions",
        kind: "list",
        itemLabel: "Question",
        fields: [
          { key: "question", label: "Question", kind: "text" },
          { key: "answer", label: "Answer", kind: "textarea" },
        ],
      },
    ] as FieldDescriptor[],
  },
};

export type SectionType = keyof typeof SECTION_TYPES;
export type SectionData<T extends SectionType> = z.infer<(typeof SECTION_TYPES)[T]["schema"]>;
export type SectionInstance = { [T in SectionType]: { id: string; type: T; visible: boolean; data: SectionData<T> } }[SectionType];

export function isSectionType(type: unknown): type is SectionType {
  return typeof type === "string" && Object.hasOwn(SECTION_TYPES, type);
}

export function sectionDefaults<T extends SectionType>(type: T): SectionData<T> {
  return structuredClone(SECTION_TYPES[type].defaults) as SectionData<T>;
}

/** Keeps only well-formed sections of known types; anything else is dropped rather than breaking the page. */
export function parseSections(raw: unknown): SectionInstance[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): SectionInstance[] => {
    const e = entry as { id?: unknown; type?: unknown; visible?: unknown; data?: unknown } | null;
    if (!e || typeof e !== "object" || typeof e.id !== "string" || !isSectionType(e.type)) return [];
    const parsed = SECTION_TYPES[e.type].schema.safeParse(e.data);
    if (!parsed.success) return [];
    return [{ id: e.id, type: e.type, visible: e.visible !== false, data: parsed.data } as SectionInstance];
  });
}

/** Replaces {{token}} placeholders (e.g. {{contactEmail}}) with setting values. */
export function interpolate(value: string, tokens: Record<string, string>): string {
  return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

function interpolateDeep(value: unknown, tokens: Record<string, string>): unknown {
  if (typeof value === "string") return interpolate(value, tokens);
  if (Array.isArray(value)) return value.map((v) => interpolateDeep(v, tokens));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, interpolateDeep(v, tokens)]));
  }
  return value;
}

export function interpolateSection(section: SectionInstance, tokens: Record<string, string>): SectionInstance {
  return { ...section, data: interpolateDeep(section.data, tokens) } as SectionInstance;
}

type DefaultPage = { title: string; seoTitle: string; seoDescription: string; sections: SectionInstance[] };

const section = <T extends SectionType>(id: string, type: T, data?: SectionData<T>): SectionInstance =>
  ({ id, type, visible: true, data: data ?? sectionDefaults(type) }) as SectionInstance;

/** System pages exactly as they were hand-coded; used until a page is published from the admin. */
export const DEFAULT_PAGES: Record<"home" | "about" | "terms" | "privacy", DefaultPage> = {
  home: {
    title: "Home",
    seoTitle: "",
    seoDescription: "",
    sections: [
      section("home-hero", "hero-carousel"),
      section("home-trust", "trust-bar"),
      section("home-products", "product-rail"),
      section("home-features", "feature-grid"),
      section("home-story", "scroll-story"),
      section("home-comparison", "material-comparison"),
      section("home-banner", "brand-banner"),
      section("home-instagram", "instagram-feed"),
    ],
  },
  about: {
    title: "About Exo Zilton",
    seoTitle: "About Exo Zilton",
    seoDescription:
      "Learn about Exo Zilton — a premium mortar and pestle brand crafting unglazed vitrified porcelain kitchen tools with timeless heritage design.",
    sections: [
      section("about-heading", "page-heading", {
        eyebrow: "Our Story",
        title: "Lovingly Crafted Mortar and Pestles",
        description:
          "Exo Zilton brings together traditional craftsmanship and modern quality standards to create mortar and pestle sets worthy of any kitchen.",
      }),
      section("about-story", "image-text", {
        image: "/brand/logo.png",
        imageAlt: "Exo Zilton brand logo",
        imageSide: "left",
        imageFit: "contain",
        heading: "",
        body: [
          "Founded in {{foundingYear}}, Exo Zilton was born from a passion for timeless kitchen tools that elevate everyday cooking. Based in {{location}}, we craft premium mortar and pestle sets that honour the heritage of this iconic kitchen essential.",
          "Each set is made from dense unglazed vitrified porcelain paired with a smooth beechwood handle — designed for comfortable, efficient grinding of herbs, spices, and pastes. The non-porous finish prevents stains and odours, ensuring every blend is pure and flavourful.",
          "From home chefs to professional kitchens, Exo Zilton mortar and pestle sets are built to stand the test of time — durable, practical, and beautifully presented in gift-ready packaging.",
        ].join("\n\n"),
      }),
      section("about-packaging", "image-text", {
        image: "/packaging/box-front.webp",
        imageAlt: "Exo Zilton gift-ready kraft packaging",
        imageSide: "left",
        imageFit: "cover",
        heading: "Gift-Ready Packaging",
        body: "Every Exo Zilton mortar and pestle arrives in elegant kraft packaging with our signature navy and gold branding — making it the perfect wedding, housewarming, or holiday gift for the cook in your life.",
      }),
    ],
  },
  terms: {
    title: "Terms of Service",
    seoTitle: "Terms of Service",
    seoDescription: "Terms of service for Exo Zilton website and product inquiries.",
    sections: [
      section("terms-text", "rich-text", {
        title: "Terms of Service",
        blocks: [
          {
            heading: "",
            body: "By using the {{siteName}} website, you agree to these terms. Please read them carefully before placing an inquiry or order.",
            bullets: [],
          },
          {
            heading: "Orders & Inquiries",
            body: "Product inquiries submitted via WhatsApp or our contact form constitute an expression of interest, not a binding contract. Final pricing, availability, and delivery terms will be confirmed directly with you before payment.",
            bullets: [],
          },
          {
            heading: "Product Information",
            body: "We strive to display accurate product descriptions and images. Minor variations in colour or finish may occur due to the natural characteristics of porcelain and wood materials.",
            bullets: [],
          },
          { heading: "Contact", body: "Questions about these terms? Email {{contactEmail}}.", bullets: [] },
        ],
      }),
    ],
  },
  privacy: {
    title: "Privacy Policy",
    seoTitle: "Privacy Policy",
    seoDescription: "Privacy policy for Exo Zilton website and inquiry forms.",
    sections: [
      section("privacy-text", "rich-text", {
        title: "Privacy Policy",
        blocks: [
          {
            heading: "",
            body: '{{siteName}} ("we", "our", or "us") respects your privacy. This policy explains how we collect and use information when you visit our website or submit an inquiry form.',
            bullets: [],
          },
          {
            heading: "Information We Collect",
            body: "When you contact us, we may collect your name, email address, phone number, country, and any message you provide. We use this information solely to respond to your inquiries and process orders.",
            bullets: [],
          },
          {
            heading: "How We Use Your Information",
            body: "",
            bullets: [
              "To respond to product inquiries and orders",
              "To provide delivery and shipping information",
              "To improve our website and customer service",
            ],
          },
          { heading: "Contact", body: "For privacy-related questions, contact us at {{contactEmail}}.", bullets: [] },
        ],
      }),
    ],
  },
};

export type SystemPageSlug = keyof typeof DEFAULT_PAGES;
