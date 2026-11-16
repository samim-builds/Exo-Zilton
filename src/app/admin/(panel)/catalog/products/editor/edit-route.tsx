import { notFound, redirect } from "next/navigation";
import { getProductForEdit, listBundleComponentOptions, listCategoriesForEditor } from "@/lib/catalog/admin-queries";
import { ProductEditor } from "./ProductEditor";

/** Shared by the products and bundles edit routes. */
export async function renderProductEditor(params: Promise<{ id: string }>, bundleRoute: boolean) {
  const { id } = await params;
  if (!process.env.DATABASE_URL) notFound();

  const [product, categories] = await Promise.all([getProductForEdit(id), listCategoriesForEditor()]);
  if (!product) notFound();
  // Bundles are edited under their own section so the sidebar and breadcrumb match.
  if (product.kind === "BUNDLE" && !bundleRoute) redirect(`/admin/catalog/bundles/${id}`);
  if (product.kind !== "BUNDLE" && bundleRoute) redirect(`/admin/catalog/products/${id}`);
  const components = product.kind === "BUNDLE" ? await listBundleComponentOptions() : [];

  return <ProductEditor key={product.id} initial={product} categories={categories} components={components} />;
}
