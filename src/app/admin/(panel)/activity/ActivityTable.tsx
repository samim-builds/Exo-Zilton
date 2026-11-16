"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ColumnHeader } from "@/components/admin/data-table/ColumnHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { ACTIVITY_ACTIONS } from "@/lib/admin/activity-types";

type Diff = Record<string, { from: unknown; to: unknown }>;

export type ActivityRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  diff: Diff | null;
  ip: string | null;
  createdAt: Date;
};

const actionStyles: Record<string, string> = {
  CREATE: "border-green-200 bg-green-50 text-green-800",
  UPDATE: "border-blue-200 bg-blue-50 text-blue-800",
  DELETE: "border-red-200 bg-red-50 text-red-800",
  PUBLISH: "border-violet-200 bg-violet-50 text-violet-800",
  STATUS: "border-amber-200 bg-amber-50 text-amber-800",
};

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function DiffDialog({ row }: { row: ActivityRow }) {
  const entries = Object.entries(row.diff ?? {});
  if (entries.length === 0) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="h-auto p-0">
          {entries.length} change{entries.length > 1 ? "s" : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{row.summary}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {entries.map(([field, change]) => (
            <div key={field} className="rounded-md border">
              <p className="border-b bg-muted/50 px-3 py-1.5 font-medium">{field}</p>
              <div className="grid gap-px bg-border sm:grid-cols-2">
                <pre className="overflow-x-auto bg-red-50/60 p-3 text-xs whitespace-pre-wrap text-red-900">{formatValue(change.from)}</pre>
                <pre className="overflow-x-auto bg-green-50/60 p-3 text-xs whitespace-pre-wrap text-green-900">{formatValue(change.to)}</pre>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const columns: ColumnDef<ActivityRow>[] = [
  {
    id: "createdAt",
    header: () => <ColumnHeader id="createdAt" title="When" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.createdAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
      </span>
    ),
  },
  {
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <Badge variant="outline" className={actionStyles[row.original.action]}>
        {titleCase(row.original.action)}
      </Badge>
    ),
  },
  { id: "entity", header: "Area", cell: ({ row }) => titleCase(row.original.entityType) },
  { id: "summary", header: "Summary", cell: ({ row }) => <span className="font-medium">{row.original.summary}</span> },
  { id: "diff", header: "Details", cell: ({ row }) => <DiffDialog row={row.original} /> },
  {
    id: "ip",
    header: "IP",
    cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.ip ?? "—"}</span>,
  },
];

export function ActivityTable({
  rows,
  total,
  entityTypes,
}: {
  rows: ActivityRow[];
  total: number;
  entityTypes: string[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      getRowId={(r) => r.id}
      searchPlaceholder="Search summaries…"
      filters={[
        { key: "entity", label: "Area", options: entityTypes.map((e) => ({ value: e, label: titleCase(e) })) },
        { key: "action", label: "Action", options: ACTIVITY_ACTIONS.map((a) => ({ value: a, label: titleCase(a) })) },
      ]}
      emptyMessage="No activity yet. Changes made in the admin panel are recorded here."
    />
  );
}
