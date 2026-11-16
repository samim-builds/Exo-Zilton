import { PageHeader } from "@/components/admin/shell/PageHeader";
import { listInventory } from "@/lib/catalog/inventory-queries";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { InventoryTable } from "./InventoryTable";

export const metadata = {
  title: "Inventory | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: ["stockQty", "product"] as const,
    defaultSort: { id: "product", desc: false },
    filters: ["stock"] as const,
  });
  const { rows, total } = process.env.DATABASE_URL
    ? await listInventory({ q: params.q, stock: params.filters.stock, sort: params.sort, skip: params.skip, take: params.take })
    : { rows: [], total: 0 };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock on hand per variant. Confirming an order takes stock; cancelling it puts stock back. Every change is logged."
      />
      <InventoryTable rows={rows} total={total} />
    </div>
  );
}
