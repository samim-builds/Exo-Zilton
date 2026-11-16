import { unstable_cache } from "next/cache";
import { queryCatalog, queryCategories, type StorefrontCategory } from "@/lib/catalog/queries";
import { categorySubtree, findByLegacySlug, flattenCatalog, toCatalogProducts } from "@/lib/catalog/storefront";
import type { CatalogProduct, Product } from "@/lib/product-types";
import { staticProducts } from "@/lib/products-static";

// Storefront catalog reads. Cached under the "catalog" tag, which admin
// catalog actions invalidate; falls back to the static catalog without a DB.

export const CATALOG_TAG = "catalog";

/** The bundled catalog as one product with a Size option, for running without a database. */
function staticCatalog(): CatalogProduct[] {
  const first = staticProducts[0];
  return toCatalogProducts([
    {
      id: "static-mortar-and-pestle",
      slug: "mortar-and-pestle",
      name: "Mortar and Pestle",
      subtitle: null,
      description: first.description.replace(`${first.size} `, ""),
      features: first.features,
      careInstructions: first.careInstructions,
      deliveryInfo: first.deliveryInfo,
      specs: { Material: first.specs.Material, Finish: first.specs.Finish, "Oven Safe": "Yes", "Freezer Safe": "Yes" },
      category: null,
      options: [
        {
          name: "Size",
          position: 0,
          values: staticProducts.map((p, i) => ({ id: p.sku, value: p.size, slug: p.size.toLowerCase().replace(/\s+/g, "-"), position: i })),
        },
      ],
      images: staticProducts.flatMap((p) =>
        p.images.map((url, i) => ({ url, alt: `${p.name} — Exo Zilton porcelain mortar and pestle`, sortOrder: i, variantId: `static-${p.sku}` })),
      ),
      variants: staticProducts.map((p, i) => ({
        id: `static-${p.sku}`,
        sku: p.sku,
        title: p.size,
        pricePKR: p.pricePKR,
        priceUSD: p.priceUSD,
        compareAtPKR: null,
        compareAtUSD: null,
        trackInventory: !p.inStock,
        stockQty: 0,
        attributes: { diameterCm: p.diameterCm, capacityMl: p.capacityMl },
        legacySlug: p.slug,
        position: i,
        active: true,
        isDefault: i === 3,
        optionValueIds: [p.sku],
      })),
      legacy: null,
    },
  ]);
}

const cachedCatalog = unstable_cache(queryCatalog, ["storefront-catalog"], { tags: [CATALOG_TAG], revalidate: 300 });
const cachedCategories = unstable_cache(queryCategories, ["storefront-categories"], { tags: [CATALOG_TAG], revalidate: 300 });

export async function getCatalog(): Promise<CatalogProduct[]> {
  if (!process.env.DATABASE_URL) return staticCatalog();
  try {
    const products = await cachedCatalog();
    return products.length > 0 ? products : staticCatalog();
  } catch {
    return staticCatalog();
  }
}

export async function getCategories(): Promise<StorefrontCategory[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await cachedCategories();
  } catch {
    return [];
  }
}

/** Listing cards: one per variant. */
export async function getPublishedProducts(): Promise<Product[]> {
  return flattenCatalog(await getCatalog());
}

export type ProductLookup =
  | { kind: "product"; product: CatalogProduct }
  | { kind: "legacy"; product: CatalogProduct; variant: CatalogProduct["variants"][number] };

/** A product by slug, or the product that replaced an old per-size URL. */
export async function lookupProduct(slug: string): Promise<ProductLookup | undefined> {
  const catalog = await getCatalog();
  const product = catalog.find((p) => p.slug === slug);
  if (product) return { kind: "product", product };
  const legacy = findByLegacySlug(catalog, slug);
  return legacy && { kind: "legacy", ...legacy };
}

export async function getAllProductSlugs(): Promise<string[]> {
  return (await getCatalog()).map((p) => p.slug);
}

export async function getCategoryPage(slug: string) {
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);
  if (!category) return undefined;
  const subtree = categorySubtree(categories, slug);
  const products = (await getCatalog()).filter((p) => p.category && subtree.has(p.category.slug));
  return {
    category,
    children: categories.filter((c) => c.parentId === category.id),
    products: flattenCatalog(products),
  };
}

/** Top-level categories that contain at least one product, for filter chips. */
export async function getShopCategories(): Promise<StorefrontCategory[]> {
  const [categories, catalog] = await Promise.all([getCategories(), getCatalog()]);
  const used = new Set(catalog.flatMap((p) => (p.category ? [p.category.slug] : [])));
  return categories.filter((c) => [...categorySubtree(categories, c.slug)].some((s) => used.has(s)) && !c.parentId);
}
