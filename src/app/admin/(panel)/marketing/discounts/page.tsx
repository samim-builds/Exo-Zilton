import Link from "next/link";
import { Plus } from "lucide-react";
import { listDiscounts } from "@/lib/commerce/admin-queries";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { DiscountsTable } from "./DiscountsTable";

export const metadata = {
  title: "Discounts | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminDiscountsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: ["code", "createdAt", "usedCount"] as const,
    defaultSort: { id: "createdAt", desc: true },
    filters: ["state", "kind"] as const,
  });
  const { rows, total } = process.env.DATABASE_URL
    ? await listDiscounts({ ...params, state: params.filters.state, kind: params.filters.kind })
    : { rows: [], total: 0 };

  return (
    <div>
      <PageHeader
        title="Discounts"
        description="Percentage, fixed-amount and free-shipping codes. Welcome codes are hidden unless you filter for them."
        actions={
          <Button asChild>
            <Link href="/admin/marketing/discounts/new">
              <Plus />
              Create discount
            </Link>
          </Button>
        }
      />
      <DiscountsTable rows={rows} total={total} />
    </div>
  );
}
