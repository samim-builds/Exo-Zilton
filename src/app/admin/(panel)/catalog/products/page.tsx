import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { listProductsAdmin } from "@/lib/catalog/admin-queries";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { ProductsTable } from "./ProductsTable";

export const metadata = {
  title: "Products | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: ["name", "updatedAt", "sortOrder"] as const,
    defaultSort: { id: "sortOrder", desc: false },
    filters: ["status", "category"] as const,
  });

  const db = Boolean(process.env.DATABASE_URL);
  const [{ rows, total }, categories] = db
    ? await Promise.all([
        listProductsAdmin({ ...params, kind: "STANDARD", status: params.filters.status, category: params.filters.category }),
        prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
      ])
    : [{ rows: [], total: 0 }, []];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Everything you sell. Archived products are hidden unless you filter for them."
        actions={
          <Button asChild>
            <Link href="/admin/catalog/products/new">
              <Plus />
              Add product
            </Link>
          </Button>
        }
      />
      <ProductsTable rows={rows} total={total} categories={categories} />
    </div>
  );
}
