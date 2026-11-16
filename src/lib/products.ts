export type { Product } from "./product-types";
export {
  getPublishedProducts,
  getProductBySlug,
  getAllProductSlugs,
} from "./products-server";

// Legacy static exports for seed/scripts
export { staticProducts } from "./products-static";
