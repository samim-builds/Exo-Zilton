import { ProductForm } from "@/components/admin/ProductForm";

export const metadata = {
  title: "New Product | Admin",
  robots: { index: false, follow: false },
};

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-navy">Add product</h1>
      <ProductForm />
    </div>
  );
}
