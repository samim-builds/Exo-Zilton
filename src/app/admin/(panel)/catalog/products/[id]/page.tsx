import { notFound } from "next/navigation";
import { getProductForEdit, listBundleComponentOptions, listCategoriesForEditor } from "@/lib/catalog/admin-queries";
import { ProductEditor } from "../editor/ProductEditor";

export const metadata = {
  title: "Edit product | Admin",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const [product, categories] = await Promise.all([getProductForEdit(id), listCategoriesForEditor()]);
  if (!product) notFound();
  const components = product.kind === "BUNDLE" ? await listBundleComponentOptions() : [];

  return <ProductEditor key={product.id} initial={product} categories={categories} components={components} />;
}
