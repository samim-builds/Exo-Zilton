import { listCategoryTree } from "@/lib/catalog/admin-queries";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { CategoriesManager } from "./CategoriesManager";

export const metadata = {
  title: "Categories | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = process.env.DATABASE_URL ? await listCategoryTree() : [];

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Group products and define the spec fields (attributes) each product type has. Subcategories inherit their parent's attributes."
      />
      <CategoriesManager categories={categories} />
    </div>
  );
}
