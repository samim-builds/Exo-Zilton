import Image from "next/image";
import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/products";
import { formatPKR } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

export const metadata = {
  title: "Products | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage() {
  const products = await getAllProductsAdmin();
  const dbConfigured = Boolean(process.env.DATABASE_URL);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy">Products</h1>
          <p className="mt-1 text-sm text-charcoal/70">Edit photos, prices, and product details</p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-navy px-5 py-2.5 text-sm uppercase tracking-widest text-white"
        >
          Add product
        </Link>
      </div>

      {!dbConfigured && (
        <p className="mb-4 text-sm text-amber-700">
          Viewing static catalog. Connect a database to create and edit products.
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-charcoal/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-charcoal/10 bg-cream/50">
            <tr>
              <th className="px-4 py-3 font-medium">Photo</th>
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-charcoal/5">
                <td className="px-4 py-3">
                  <div className="relative h-14 w-14 overflow-hidden rounded-md bg-porcelain">
                    {product.images[0] && (
                      <Image src={product.images[0]} alt="" fill className="object-contain p-1" sizes="56px" />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-navy">{product.name}</p>
                  <p className="text-xs text-charcoal/60">{product.sku}</p>
                </td>
                <td className="px-4 py-3">{formatPKR(product.pricePKR)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-1 text-xs ${product.published ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"}`}>
                    {product.published ? "Published" : "Draft"}
                  </span>
                  {!product.inStock && (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs text-red-800">Out of stock</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/admin/products/${product.id}/edit`} className="text-navy underline">
                      Edit
                    </Link>
                    {dbConfigured && !product.id.startsWith("static-") && (
                      <DeleteProductButton productId={product.id} productName={product.name} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
