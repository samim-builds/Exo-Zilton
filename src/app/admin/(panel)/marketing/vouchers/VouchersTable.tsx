"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/admin/data-table/ColumnHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import type { VoucherListRow } from "@/lib/commerce/admin-queries";
import { voucherState } from "@/lib/commerce/display";
import { formatMoney } from "@/lib/order-schema";
import { setVouchersActive } from "./actions";

const columns: ColumnDef<VoucherListRow>[] = [
  {
    id: "code",
    header: "Code",
    cell: ({ row }) => (
      <Link href={`/admin/marketing/vouchers/${row.original.id}`} className="block">
        <span className="font-mono font-medium text-navy hover:underline">{row.original.code}</span>
        {row.original.recipientEmail && <span className="block text-xs text-muted-foreground">{row.original.recipientEmail}</span>}
      </Link>
    ),
  },
  {
    id: "balance",
    header: () => <ColumnHeader id="balance" title="Balance" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatMoney(row.original.balance, row.original.currency)}
        <span className="text-muted-foreground"> of {formatMoney(row.original.initialBalance, row.original.currency)}</span>
      </span>
    ),
  },
  {
    id: "state",
    header: "Status",
    cell: ({ row }) => {
      const state = voucherState(row.original);
      return (
        <Badge variant="outline" className={state.className}>
          {state.label}
        </Badge>
      );
    },
  },
  {
    id: "expiresAt",
    header: "Expires",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.expiresAt ? row.original.expiresAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Never"}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: () => <ColumnHeader id="createdAt" title="Issued" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </span>
    ),
  },
];

function BulkActions({ selected, clear }: { selected: VoucherListRow[]; clear: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ids = selected.map((r) => r.id);

  function run(active: boolean) {
    start(async () => {
      const res = await setVouchersActive({ ids, active });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${res.data.count} voucher(s) ${active ? "reactivated" : "deactivated"}`);
      clear();
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(true)}>
        Reactivate
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(false)}>
        Deactivate
      </Button>
    </>
  );
}

export function VouchersTable({ rows, total }: { rows: VoucherListRow[]; total: number }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      getRowId={(r) => r.id}
      searchPlaceholder="Search code, email or note…"
      filters={[
        {
          key: "state",
          label: "Status",
          options: [
            { value: "usable", label: "Usable" },
            { value: "empty", label: "Used" },
            { value: "expired", label: "Expired" },
            { value: "inactive", label: "Inactive" },
          ],
        },
        {
          key: "currency",
          label: "Currency",
          options: [
            { value: "PKR", label: "PKR" },
            { value: "USD", label: "USD" },
          ],
        },
      ]}
      emptyMessage="No gift vouchers yet."
      bulkActions={(selected, clear) => <BulkActions selected={selected} clear={clear} />}
    />
  );
}
