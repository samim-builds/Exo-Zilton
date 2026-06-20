export type { Product, ProductWithId } from "./product-types";
export {
  getPublishedProducts,
  getProductBySlug,
  getAllProductSlugs,
  getAllProductsAdmin,
  getProductByIdAdmin,
} from "./products-server";

// Legacy static exports for seed/scripts
export { staticProducts } from "./products-static";
