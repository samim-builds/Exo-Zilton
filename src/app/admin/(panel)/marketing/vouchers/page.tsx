import { listVouchers } from "@/lib/commerce/admin-queries";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { IssueVoucherDialog } from "./IssueVoucherDialog";
import { VouchersTable } from "./VouchersTable";

export const metadata = {
  title: "Gift vouchers | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminVouchersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: ["createdAt", "balance"] as const,
    defaultSort: { id: "createdAt", desc: true },
    filters: ["state", "currency"] as const,
  });
  const { rows, total } = process.env.DATABASE_URL
    ? await listVouchers({ ...params, state: params.filters.state, currency: params.filters.currency })
    : { rows: [], total: 0 };

  return (
    <div>
      <PageHeader
        title="Gift vouchers"
        description="Stored-value codes. Customers spend them at checkout and keep any remaining balance."
        actions={<IssueVoucherDialog />}
      />
      <VouchersTable rows={rows} total={total} />
    </div>
  );
}
