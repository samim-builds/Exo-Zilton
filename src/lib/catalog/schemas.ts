import { z } from "zod";

// Admin input schemas for the catalog. Cross-field rules (unique SKUs, a
// complete and unique option combination per variant) live here so the
// editor and the server action agree.

export const slugSchema = z
  .string()
  .trim()
  .min(2, "At least 2 characters")
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

const optionalText = z.string().trim().max(300).optional();
const money = z.number().int("Whole amounts only").min(0, "Can't be negative");
const optionalMoney = money.nullable().optional();

export const variantInputSchema = z.object({
  id: z.string().optional(),
  /** Stable client key so images can point at variants that don't exist yet. */
  key: z.string().min(1),
  combo: z.record(z.string(), z.string()),
  sku: z.string().trim().min(1, "SKU is required").max(64),
  pricePKR: money,
  priceUSD: money,
  compareAtPKR: optionalMoney,
  compareAtUSD: optionalMoney,
  costPKR: optionalMoney,
  trackInventory: z.boolean(),
  stockQty: z.number().int(),
  lowStockThreshold: z.number().int().min(0),
  weightGrams: z.number().int().min(0).nullable().optional(),
  attributes: z.record(z.string(), z.unknown()),
  active: z.boolean(),
});

export const bundleInputSchema = z.object({
  mode: z.enum(["FIXED", "PERCENT_OFF"]),
  discountPercent: z.number().int().nullable(),
  items: z
    .array(z.object({ variantId: z.string().min(1), quantity: z.number().int().min(1, "At least 1").max(20, "At most 20") }))
    .max(20, "At most 20 items"),
});

export const productInputSchema = z
  .object({
    id: z.string().optional(),
    kind: z.enum(["STANDARD", "BUNDLE"]).default("STANDARD"),
    /** Bundles only: pricing and contents. */
    bundle: bundleInputSchema.nullable().default(null),
    name: z.string().trim().min(2, "At least 2 characters").max(160),
    slug: slugSchema,
    subtitle: optionalText,
    categoryId: z.string().nullable(),
    status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]),
    description: z.string().trim().max(10000),
    features: z.array(z.string().trim().min(1)).max(30),
    careInstructions: z.array(z.string().trim().min(1)).max(30),
    deliveryInfo: z.string().trim().max(2000),
    specs: z.array(z.object({ key: z.string().trim().min(1), value: z.string().trim() })).max(40),
    attributes: z.record(z.string(), z.unknown()),
    tags: z.array(z.string().trim().min(1).max(40)).max(30),
    featured: z.boolean(),
    sortOrder: z.number().int(),
    seoTitle: optionalText,
    seoDescription: optionalText,
    options: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Name the option").max(40),
          values: z.array(z.string().trim().min(1)).min(1, "Add at least one value").max(50),
        }),
      )
      .max(3),
    variants: z.array(variantInputSchema).min(1, "Add at least one variant").max(100),
    images: z
      .array(z.object({ url: z.string().min(1), alt: z.string().trim().max(300), variantKey: z.string().nullable().optional() }))
      .max(40),
  })
  .superRefine((product, ctx) => {
    if (product.kind === "BUNDLE") {
      const bundle = product.bundle;
      if (!bundle) ctx.addIssue({ code: "custom", path: ["bundle"], message: "Add the bundle's contents" });
      if (product.options.length > 0) ctx.addIssue({ code: "custom", path: ["options"], message: "A bundle has no options" });
      if (product.variants.length !== 1) ctx.addIssue({ code: "custom", path: ["variants"], message: "A bundle has a single SKU" });
      if (bundle) {
        if (bundle.items.length === 0) {
          ctx.addIssue({ code: "custom", path: ["bundle", "items"], message: "Add at least one item to the bundle" });
        }
        const seen = new Set<string>();
        bundle.items.forEach((item, i) => {
          if (seen.has(item.variantId)) {
            ctx.addIssue({ code: "custom", path: ["bundle", "items", i, "variantId"], message: "This item is already in the bundle" });
          }
          seen.add(item.variantId);
        });
        const pct = bundle.discountPercent;
        if (bundle.mode === "PERCENT_OFF" && (pct === null || pct < 1 || pct > 90)) {
          ctx.addIssue({ code: "custom", path: ["bundle", "discountPercent"], message: "Enter the discount, from 1 to 90%" });
        }
      }
    }

    const optionNames = new Set<string>();
    product.options.forEach((option, i) => {
      const lower = option.name.toLowerCase();
      if (optionNames.has(lower)) {
        ctx.addIssue({ code: "custom", path: ["options", i, "name"], message: "Option names must be unique" });
      }
      optionNames.add(lower);
    });

    const skus = new Set<string>();
    const combos = new Set<string>();
    product.variants.forEach((variant, i) => {
      const sku = variant.sku.toUpperCase();
      if (skus.has(sku)) {
        ctx.addIssue({ code: "custom", path: ["variants", i, "sku"], message: "SKU is used by another variant" });
      }
      skus.add(sku);

      let complete = true;
      for (const option of product.options) {
        const value = variant.combo[option.name];
        if (!value) {
          complete = false;
          ctx.addIssue({ code: "custom", path: ["variants", i, "combo"], message: `Choose a value for ${option.name}` });
        } else if (!option.values.includes(value)) {
          complete = false;
          ctx.addIssue({
            code: "custom",
            path: ["variants", i, "combo"],
            message: `"${value}" is not a value of ${option.name}`,
          });
        }
      }
      if (!complete) return;

      const signature = product.options.map((o) => variant.combo[o.name]).join("\u0000");
      if (combos.has(signature)) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", i, "combo"],
          message: "Another variant already has these options",
        });
      }
      combos.add(signature);
    });

    const keys = new Set(product.variants.map((v) => v.key));
    product.images.forEach((image, i) => {
      if (image.variantKey && !keys.has(image.variantKey)) {
        ctx.addIssue({ code: "custom", path: ["images", i, "variantKey"], message: "Unknown variant" });
      }
    });
  });

export type ProductInput = z.input<typeof productInputSchema>;
export type VariantInput = z.input<typeof variantInputSchema>;

export const categoryInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "At least 2 characters").max(80),
  slug: slugSchema,
  description: z.string().trim().max(2000).optional(),
  imageUrl: z.string().nullable().optional(),
  parentId: z.string().nullable(),
  sortOrder: z.number().int(),
  published: z.boolean(),
  seoTitle: optionalText,
  seoDescription: optionalText,
  attributes: z
    .array(
      z.object({
        id: z.string().optional(),
        key: z
          .string()
          .trim()
          .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, "Letters and numbers, starting with a letter"),
        label: z.string().trim().min(1, "Label is required").max(60),
        type: z.enum(["TEXT", "NUMBER", "SELECT", "BOOLEAN"]),
        unit: z.string().trim().max(12).nullable().optional(),
        options: z.array(z.string().trim().min(1)).max(50),
        scope: z.enum(["PRODUCT", "VARIANT"]),
        required: z.boolean(),
      }),
    )
    .max(40)
    .superRefine((attrs, ctx) => {
      const seen = new Set<string>();
      attrs.forEach((a, i) => {
        if (seen.has(a.key)) ctx.addIssue({ code: "custom", path: [i, "key"], message: "Keys must be unique" });
        seen.add(a.key);
        if (a.type === "SELECT" && a.options.length === 0) {
          ctx.addIssue({ code: "custom", path: [i, "options"], message: "Add at least one choice" });
        }
      });
    }),
});

export type CategoryInput = z.input<typeof categoryInputSchema>;
