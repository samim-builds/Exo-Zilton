import "dotenv/config";
import { createPrismaClient } from "../src/lib/db";
import { staticProducts } from "../src/lib/products-static";

const prisma = createPrismaClient();

async function main() {
  console.log("Seeding database...");

  for (const [index, product] of staticProducts.entries()) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        size: product.size,
        diameterCm: product.diameterCm,
        capacityMl: product.capacityMl,
        pricePKR: product.pricePKR,
        priceUSD: product.priceUSD,
        inStock: product.inStock,
        published: true,
        sortOrder: index,
        description: product.description,
        features: product.features,
        specs: product.specs,
        careInstructions: product.careInstructions,
        deliveryInfo: product.deliveryInfo,
        images: {
          create: product.images.map((url, imgIndex) => ({
            url,
            alt: `${product.name} — view ${imgIndex + 1}`,
            sortOrder: imgIndex,
          })),
        },
      },
    });
  }

  console.log(`Seeded ${staticProducts.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
