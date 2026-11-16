// One-time, idempotent conversion of per-size product rows into one product
// with "Size" variants (catalog v2). Additive only: legacy rows are archived,
// not deleted, and their images are copied, so a previous deployment that
// still reads the old columns keeps working.
//
// Run after `prisma migrate deploy`:  npm run db:catalog-v2

import "dotenv/config";
import { createPrismaClient } from "../../src/lib/db";
import { MIGRATED_PRODUCT_SLUG, planCatalogMigration } from "../../src/lib/catalog/migration-plan";

const prisma = createPrismaClient();

const CATEGORY = {
  slug: "mortar-and-pestle",
  name: "Mortar & Pestle",
  description: "Unglazed vitrified porcelain mortar and pestle sets with beechwood handles.",
};

async function main() {
  const existing = await prisma.product.findUnique({
    where: { slug: MIGRATED_PRODUCT_SLUG },
    include: { variants: true },
  });

  if (existing && existing.variants.length > 0) {
    console.log(`"${MIGRATED_PRODUCT_SLUG}" already has ${existing.variants.length} variants — backfilling only.`);
  } else {
    const legacyRows = await prisma.product.findMany({
      where: { variants: { none: {} }, size: { not: null }, slug: { not: MIGRATED_PRODUCT_SLUG } },
      include: { images: true },
    });
    const plan = planCatalogMigration(legacyRows);
    if (!plan) {
      console.log("No legacy per-size products found. Nothing to do.");
      return;
    }

    await prisma.$transaction(async (tx) => {
      const category = await tx.category.upsert({
        where: { slug: CATEGORY.slug },
        update: {},
        create: {
          ...CATEGORY,
          attributes: {
            create: [
              { key: "material", label: "Material", type: "TEXT", scope: "PRODUCT", sortOrder: 0 },
              { key: "diameterCm", label: "Diameter", type: "NUMBER", unit: "cm", scope: "VARIANT", required: true, sortOrder: 1 },
              { key: "capacityMl", label: "Capacity", type: "NUMBER", unit: "ml", scope: "VARIANT", required: true, sortOrder: 2 },
            ],
          },
        },
      });

      const product = await tx.product.create({
        data: {
          ...plan.product,
          specs: plan.product.specs ?? {},
          status: "ACTIVE",
          categoryId: category.id,
          attributes: { material: "Unglazed vitrified porcelain" },
          // Legacy flag: keeps the previous deployment from listing this row.
          published: false,
          options: {
            create: { name: "Size", position: 0, values: { create: plan.optionValues } },
          },
        },
        include: { options: { include: { values: true } } },
      });
      const valueIds = new Map(product.options[0].values.map((v) => [v.slug, v.id]));

      for (const variant of plan.variants) {
        const { legacyId, optionSlug, imageIds, ...data } = variant;
        const created = await tx.productVariant.create({
          data: {
            ...data,
            productId: product.id,
            optionValues: { create: { optionValueId: valueIds.get(optionSlug)! } },
          },
        });

        const legacy = legacyRows.find((r) => r.id === legacyId)!;
        const images = legacy.images.filter((img) => imageIds.includes(img.id));
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img) => ({
              productId: product.id,
              variantId: created.id,
              url: img.url,
              alt: img.alt,
              sortOrder: img.sortOrder,
            })),
          });
        }
      }

      await tx.product.updateMany({
        where: { id: { in: plan.variants.map((v) => v.legacyId) } },
        data: { status: "ARCHIVED" },
      });

      console.log(`Created "${product.slug}" with ${plan.variants.length} variants; archived the legacy rows.`);
    });
  }

  // Link past order lines to the variant that replaced their product row.
  const variants = await prisma.productVariant.findMany({
    where: { legacySlug: { not: null } },
    select: { id: true, legacySlug: true },
  });
  let linked = 0;
  for (const v of variants) {
    const legacy = await prisma.product.findUnique({ where: { slug: v.legacySlug! }, select: { id: true } });
    if (!legacy) continue;
    const { count } = await prisma.orderItem.updateMany({
      where: { productId: legacy.id, variantId: null },
      data: { variantId: v.id },
    });
    linked += count;
  }
  console.log(`Linked ${linked} past order line(s) to variants.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
