import { listBundleComponentOptions, listCategoriesForEditor } from "@/lib/catalog/admin-queries";
import type { ProductInput } from "@/lib/catalog/schemas";
import { ProductEditor } from "../../products/editor/ProductEditor";

export const metadata = {
  title: "New bundle | Admin",
  robots: { index: false, follow: false },
};

const blank: ProductInput = {
  kind: "BUNDLE",
  bundle: { mode: "PERCENT_OFF", discountPercent: 10, items: [] },
  name: "",
  slug: "",
  subtitle: "",
  categoryId: null,
  status: "DRAFT",
  description: "",
  features: [],
  careInstructions: [],
  deliveryInfo: "",
  specs: [],
  attributes: {},
  tags: [],
  featured: false,
  sortOrder: 0,
  seoTitle: "",
  seoDescription: "",
  options: [],
  variants: [
    {
      key: "default",
      combo: {},
      sku: "",
      pricePKR: 0,
      priceUSD: 0,
      compareAtPKR: null,
      compareAtUSD: null,
      costPKR: null,
      trackInventory: false,
      stockQty: 0,
      lowStockThreshold: 5,
      attributes: {},
      active: true,
    },
  ],
  images: [],
};

export default async function NewBundlePage() {
  const db = Boolean(process.env.DATABASE_URL);
  const [categories, components] = db ? await Promise.all([listCategoriesForEditor(), listBundleComponentOptions()]) : [[], []];
  return <ProductEditor initial={blank} categories={categories} components={components} />;
}
