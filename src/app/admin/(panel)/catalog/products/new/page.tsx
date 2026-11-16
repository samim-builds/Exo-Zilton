import { listCategoriesForEditor } from "@/lib/catalog/admin-queries";
import type { ProductInput } from "@/lib/catalog/schemas";
import { ProductEditor } from "../editor/ProductEditor";

export const metadata = {
  title: "New product | Admin",
  robots: { index: false, follow: false },
};

const blank: ProductInput = {
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

export default async function NewProductPage() {
  const categories = process.env.DATABASE_URL ? await listCategoriesForEditor() : [];
  return <ProductEditor initial={blank} categories={categories} />;
}
