import Link from "next/link";
import { getAllProductsAdmin } from "@/lib/products";

export const metadata = {
  title: "Admin Dashboard | Exo Zilton",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const products = await getAllProductsAdmin();
  const dbConfigured = Boolean(process.env.DATABASE_URL);

  return (
    <div>
      <h1 className="font-serif text-3xl font-semibold text-navy">Dashboard</h1>
      <p className="mt-2 text-charcoal/70">Manage your product catalog, photos, and pricing.</p>

      {!dbConfigured && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Database not connected.</strong> Add <code className="rounded bg-white px-1">DATABASE_URL</code> to
          your environment, run <code className="rounded bg-white px-1">npx prisma migrate dev</code> and{" "}
          <code className="rounded bg-white px-1">npx prisma db seed</code> to enable saving changes.
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-charcoal/10 bg-white p-6">
          <p className="text-sm text-charcoal/60">Total products</p>
          <p className="mt-1 text-3xl font-semibold text-navy">{products.length}</p>
        </div>
        <div className="rounded-lg border border-charcoal/10 bg-white p-6">
          <p className="text-sm text-charcoal/60">In stock</p>
          <p className="mt-1 text-3xl font-semibold text-navy">{products.filter((p) => p.inStock).length}</p>
        </div>
        <div className="rounded-lg border border-charcoal/10 bg-white p-6">
          <p className="text-sm text-charcoal/60">Published</p>
          <p className="mt-1 text-3xl font-semibold text-navy">{products.filter((p) => p.published).length}</p>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/admin/products/new"
          className="inline-flex rounded-full bg-navy px-6 py-3 text-sm uppercase tracking-widest text-white"
        >
          Add new product
        </Link>
      </div>
    </div>
  );
}
