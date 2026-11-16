export type { CatalogProduct, CatalogVariant, Product } from "./product-types";
export {
  getCatalog,
  getCategories,
  getCategoryPage,
  getPublishedProducts,
  getShopCategories,
  getAllProductSlugs,
  lookupProduct,
} from "./products-server";

// Legacy static exports for seed/scripts
export { staticProducts } from "./products-static";
