import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getProductByIdAdmin } from "@/lib/products";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductByIdAdmin(id);
  return {
    title: product ? `Edit ${product.name} | Admin` : "Edit Product | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductByIdAdmin(id);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-navy">Edit product</h1>
      <ProductForm product={product} />
    </div>
  );
}
