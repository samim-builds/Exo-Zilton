"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ColumnHeader } from "@/components/admin/data-table/ColumnHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import type { DiscountListRow } from "@/lib/commerce/admin-queries";
import { DISCOUNT_STATUS_LABELS as STATUS_LABELS, DISCOUNT_STATUS_STYLES as STATUS_STYLES } from "@/lib/commerce/display";
import { formatMoney } from "@/lib/order-schema";
import { deleteDiscounts, setDiscountsActive } from "./actions";

function describeValue(d: DiscountListRow): string {
  if (d.type === "FREE_SHIPPING") return "Free shipping";
  if (d.type === "PERCENT") return `${d.percentOff}% off`;
  const amounts = [d.valuePKR && formatMoney(d.valuePKR, "PKR"), d.valueUSD && formatMoney(d.valueUSD, "USD")].filter(Boolean);
  return `${amounts.join(" / ")} off`;
}

const columns: ColumnDef<DiscountListRow>[] = [
  {
    id: "code",
    header: () => <ColumnHeader id="code" title="Code" />,
    cell: ({ row }) => (
      <Link href={`/admin/marketing/discounts/${row.original.id}`} className="block">
        <span className="font-mono font-medium text-navy hover:underline">{row.original.code}</span>
        <span className="block text-xs text-muted-foreground">{row.original.title}</span>
      </Link>
    ),
  },
  { id: "value", header: "Value", cell: ({ row }) => describeValue(row.original) },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className={STATUS_STYLES[row.original.status]}>
        {STATUS_LABELS[row.original.status]}
      </Badge>
    ),
  },
  {
    id: "usedCount",
    header: () => <ColumnHeader id="usedCount" title="Used" />,
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.usedCount}
        {row.original.usageLimit !== null && <span className="text-muted-foreground"> / {row.original.usageLimit}</span>}
      </span>
    ),
  },
  {
    id: "dates",
    header: "Runs",
    cell: ({ row }) => {
      const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const { startsAt, endsAt } = row.original;
      if (!startsAt && !endsAt) return <span className="text-muted-foreground">No end date</span>;
      return (
        <span className="whitespace-nowrap text-muted-foreground">
          {startsAt ? fmt(startsAt) : "Now"} – {endsAt ? fmt(endsAt) : "no end"}
        </span>
      );
    },
  },
  {
    id: "createdAt",
    header: () => <ColumnHeader id="createdAt" title="Created" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </span>
    ),
  },
];

function BulkActions({ selected, clear }: { selected: DiscountListRow[]; clear: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const ids = selected.map((r) => r.id);

  function run(action: () => Promise<{ ok: true; data: { count: number } } | { ok: false; error: string }>, message: string) {
    start(async () => {
      const res = await action();
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${res.data.count} ${message}`);
      clear();
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setDiscountsActive({ ids, active: true }), "activated")}>
        Activate
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setDiscountsActive({ ids, active: false }), "deactivated")}>
        Deactivate
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={pending}>
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} discount(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Codes already used on orders can&apos;t be deleted; deactivate those instead. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => run(() => deleteDiscounts({ ids }), "deleted")}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function DiscountsTable({ rows, total }: { rows: DiscountListRow[]; total: number }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      getRowId={(r) => r.id}
      searchPlaceholder="Search codes…"
      filters={[
        {
          key: "state",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "expired", label: "Expired" },
          ],
        },
        {
          key: "kind",
          label: "Type",
          options: [
            { value: "STANDARD", label: "Discount codes" },
            { value: "WELCOME", label: "Welcome codes" },
          ],
        },
      ]}
      emptyMessage="No discounts yet."
      bulkActions={(selected, clear) => <BulkActions selected={selected} clear={clear} />}
    />
  );
}
