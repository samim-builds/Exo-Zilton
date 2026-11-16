"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/data-table/DataTable";
import type { SubscriberRow } from "@/lib/cms/admin-queries";

const columns: ColumnDef<SubscriberRow>[] = [
  { id: "email", header: "Email", cell: ({ row }) => <span className="font-medium">{row.original.email}</span> },
  {
    id: "code",
    header: "Welcome code",
    cell: ({ row }) =>
      row.original.code ? (
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs">{row.original.code}</span>
          {row.original.codeUsed && (
            <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
              Used
            </Badge>
          )}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
  },
  { id: "source", header: "Source", cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.source}</span> },
  {
    id: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {new Date(row.original.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
      </span>
    ),
  },
];

export function SubscribersTable({ rows, total }: { rows: SubscriberRow[]; total: number }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      getRowId={(r) => r.id}
      searchPlaceholder="Search email…"
      emptyMessage="No subscribers yet. Turn on the welcome offer in Settings to start collecting sign-ups."
    />
  );
}
