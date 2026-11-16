import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { AdminActionError } from "@/lib/admin/action";
import { effectiveAttributes, validateAttributeValues, type AttributeDef } from "./attributes";
import type { categoryInputSchema, productInputSchema } from "./schemas";
import { slugifyOptionValue, variantTitle } from "./variants";
import { applyMovements } from "./inventory-server";

type ProductData = z.output<typeof productInputSchema>;
type CategoryData = z.output<typeof categoryInputSchema>;

export function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

async function attributeDefsFor(categoryId: string | null): Promise<AttributeDef[]> {
  if (!categoryId) return [];
  const categories = await prisma.category.findMany({
    select: { id: true, parentId: true, attributes: true },
  });
  return effectiveAttributes(categoryId, categories);
}

function attributeErrorMessage(errors: Record<string, string>, where: string): string {
  return `${where}: ${Object.values(errors).join("; ")}`;
}

/** Validates attribute values against the product's category definitions. */
async function resolveAttributes(data: ProductData) {
  const defs = await attributeDefsFor(data.categoryId);
  const productDefs = defs.filter((d) => d.scope === "PRODUCT");
  const variantDefs = defs.filter((d) => d.scope === "VARIANT");

  const product = validateAttributeValues(productDefs, data.attributes);
  if (!product.ok) throw new AdminActionError(attributeErrorMessage(product.errors, "Attributes"));

  const variants = data.variants.map((variant) => {
    const result = validateAttributeValues(variantDefs, variant.attributes);
    if (!result.ok) {
      throw new AdminActionError(attributeErrorMessage(result.errors, `Variant ${variantTitle(variant.combo)}`));
    }
    return result.values;
  });

  return { product: product.values, variants };
}

/** Creates or updates a product with its options, variants and images in one transaction. */
export async function saveProductGraph(data: ProductData): Promise<{ id: string; slug: string; created: boolean }> {
  const attributes = await resolveAttributes(data);

  const fields = {
    name: data.name,
    slug: data.slug,
    subtitle: data.subtitle || null,
    categoryId: data.categoryId,
    status: data.status,
    description: data.description,
    features: data.features,
    careInstructions: data.careInstructions,
    deliveryInfo: data.deliveryInfo,
    specs: Object.fromEntries(data.specs.map((s) => [s.key, s.value])),
    attributes: attributes.product,
    tags: data.tags,
    featured: data.featured,
    sortOrder: data.sortOrder,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  } satisfies Prisma.ProductUncheckedUpdateInput;

  try {
    return await prisma.$transaction(async (tx) => {
      const product = data.id
        ? await tx.product.update({ where: { id: data.id }, data: fields })
        : await tx.product.create({ data: { ...fields, published: false } });

      // Options and their values: keep matching ones (so variant links survive), drop the rest.
      const existingOptions = await tx.productOption.findMany({
        where: { productId: product.id },
        include: { values: true },
      });
      await tx.productOption.deleteMany({
        where: { productId: product.id, name: { notIn: data.options.map((o) => o.name) } },
      });

      const valueIds = new Map<string, string>(); // "Option\0value" → id
      for (const [position, option] of data.options.entries()) {
        const existing = existingOptions.find((o) => o.name === option.name);
        const saved = existing
          ? await tx.productOption.update({ where: { id: existing.id }, data: { position } })
          : await tx.productOption.create({ data: { productId: product.id, name: option.name, position } });

        const slugs = option.values.map(slugifyOptionValue);
        await tx.productOptionValue.deleteMany({ where: { optionId: saved.id, slug: { notIn: slugs } } });
        for (const [i, value] of option.values.entries()) {
          const row = await tx.productOptionValue.upsert({
            where: { optionId_slug: { optionId: saved.id, slug: slugs[i] } },
            update: { value, position: i },
            create: { optionId: saved.id, value, slug: slugs[i], position: i },
          });
          valueIds.set(`${option.name}\u0000${value}`, row.id);
        }
      }

      // Variants: update kept ones, create new ones, remove dropped ones. A dropped
      // variant that appears on past orders is deactivated instead, keeping the link.
      const existingVariants = await tx.productVariant.findMany({
        where: { productId: product.id },
        select: { id: true, _count: { select: { orderItems: true } } },
      });
      const keptIds = new Set(data.variants.flatMap((v) => (v.id ? [v.id] : [])));
      for (const old of existingVariants.filter((v) => !keptIds.has(v.id))) {
        if (old._count.orderItems > 0) {
          await tx.productVariant.update({ where: { id: old.id }, data: { active: false, sku: `${old.id}-retired` } });
        } else {
          await tx.productVariant.delete({ where: { id: old.id } });
        }
      }

      const variantIdByKey = new Map<string, string>();
      for (const [position, variant] of data.variants.entries()) {
        const variantFields = {
          sku: variant.sku.toUpperCase(),
          title: variantTitle(variant.combo),
          pricePKR: variant.pricePKR,
          priceUSD: variant.priceUSD,
          compareAtPKR: variant.compareAtPKR ?? null,
          compareAtUSD: variant.compareAtUSD ?? null,
          costPKR: variant.costPKR ?? null,
          trackInventory: variant.trackInventory,
          lowStockThreshold: variant.lowStockThreshold,
          weightGrams: variant.weightGrams ?? null,
          attributes: attributes.variants[position],
          active: variant.active,
          isDefault: position === 0,
          position,
        };
        const owned = variant.id && existingVariants.some((v) => v.id === variant.id);
        // Stock on saved variants only changes through the inventory ledger; new ones
        // start at the entered count, recorded as an opening movement.
        const saved = owned
          ? await tx.productVariant.update({ where: { id: variant.id }, data: variantFields })
          : await tx.productVariant.create({ data: { ...variantFields, productId: product.id } });
        if (!owned && variant.trackInventory && variant.stockQty !== 0) {
          await applyMovements(tx, [{ variantId: saved.id, delta: variant.stockQty, reason: "RESTOCK", note: "Opening stock" }]);
        }
        variantIdByKey.set(variant.key, saved.id);

        await tx.variantOptionValue.deleteMany({ where: { variantId: saved.id } });
        const links = data.options.map((o) => valueIds.get(`${o.name}\u0000${variant.combo[o.name]}`)!);
        if (links.length > 0) {
          await tx.variantOptionValue.createMany({
            data: links.map((optionValueId) => ({ variantId: saved.id, optionValueId })),
          });
        }
      }

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((image, sortOrder) => ({
            productId: product.id,
            variantId: image.variantKey ? (variantIdByKey.get(image.variantKey) ?? null) : null,
            url: image.url,
            alt: image.alt || data.name,
            sortOrder,
          })),
        });
      }

      return { id: product.id, slug: product.slug, created: !data.id };
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AdminActionError("That slug or one of the SKUs is already used by another product.");
    }
    throw error;
  }
}

export async function saveCategoryGraph(data: CategoryData): Promise<{ id: string; created: boolean }> {
  if (data.id && data.parentId) {
    // Refuse to nest a category under itself or one of its descendants.
    const all = await prisma.category.findMany({ select: { id: true, parentId: true } });
    const parentOf = new Map(all.map((c) => [c.id, c.parentId]));
    for (let id: string | null = data.parentId; id; id = parentOf.get(id) ?? null) {
      if (id === data.id) throw new AdminActionError("A category can't be placed inside itself.");
    }
  }

  const fields = {
    name: data.name,
    slug: data.slug,
    description: data.description || null,
    imageUrl: data.imageUrl || null,
    parentId: data.parentId,
    sortOrder: data.sortOrder,
    published: data.published,
    seoTitle: data.seoTitle || null,
    seoDescription: data.seoDescription || null,
  };

  try {
    return await prisma.$transaction(async (tx) => {
      const category = data.id
        ? await tx.category.update({ where: { id: data.id }, data: fields })
        : await tx.category.create({ data: fields });

      await tx.categoryAttribute.deleteMany({
        where: { categoryId: category.id, key: { notIn: data.attributes.map((a) => a.key) } },
      });
      for (const [sortOrder, attr] of data.attributes.entries()) {
        const attrFields = {
          label: attr.label,
          type: attr.type,
          unit: attr.unit || null,
          options: attr.type === "SELECT" ? attr.options : [],
          scope: attr.scope,
          required: attr.required,
          sortOrder,
        };
        await tx.categoryAttribute.upsert({
          where: { categoryId_key: { categoryId: category.id, key: attr.key } },
          update: attrFields,
          create: { ...attrFields, categoryId: category.id, key: attr.key },
        });
      }

      return { id: category.id, created: !data.id };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AdminActionError("Another category already uses that slug.");
    throw error;
  }
}
