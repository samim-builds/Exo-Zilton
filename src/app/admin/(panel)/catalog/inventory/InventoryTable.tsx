"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ColumnHeader } from "@/components/admin/data-table/ColumnHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { Field } from "@/components/admin/form/Field";
import { isLowStock } from "@/lib/catalog/inventory";
import type { InventoryRow, MovementRow } from "@/lib/catalog/inventory-queries";
import { adjustStock, loadMovements, setLowStockThreshold, setTracking } from "./actions";

const REASON_LABELS: Record<string, string> = {
  ORDER: "Order",
  CANCEL: "Order cancelled",
  RESTOCK: "Restock",
  ADJUSTMENT: "Count correction",
  RETURN: "Customer return",
};

function StockBadge({ row }: { row: InventoryRow }) {
  if (!row.trackInventory) return <span className="text-xs text-muted-foreground">Not tracked</span>;
  if (row.stockQty <= 0)
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
        Out of stock
      </Badge>
    );
  if (isLowStock(row))
    return (
      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
        Low
      </Badge>
    );
  return (
    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
      In stock
    </Badge>
  );
}

function ThresholdInput({ row }: { row: InventoryRow }) {
  const router = useRouter();
  const [value, setValue] = useState(String(row.lowStockThreshold));
  const [pending, start] = useTransition();

  function save() {
    const n = Math.max(0, Math.round(Number(value)) || 0);
    if (n === row.lowStockThreshold) return setValue(String(n));
    start(async () => {
      const res = await setLowStockThreshold({ variantId: row.id, lowStockThreshold: n });
      if (!res.ok) return void toast.error(res.error);
      router.refresh();
    });
  }

  return (
    <Input
      aria-label={`Low-stock alert level for ${row.sku}`}
      type="number"
      min={0}
      value={value}
      disabled={pending || !row.trackInventory}
      onFocus={(e) => e.target.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="h-8 w-20"
    />
  );
}

function AdjustDialog({ row, onClose }: { row: InventoryRow; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "set">("add");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState<"RESTOCK" | "ADJUSTMENT" | "RETURN">("RESTOCK");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const n = Math.round(Number(value));
  const valid = value !== "" && Number.isFinite(n) && (mode === "set" ? n >= 0 : n !== 0);
  const after = mode === "set" ? n : row.stockQty + n;

  function submit() {
    start(async () => {
      const res = await adjustStock({ variantId: row.id, mode, value: n, reason, note });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${row.sku} now has ${res.data.stockQty} in stock`);
      onClose();
      router.refresh();
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {row.productName} — {row.title || row.sku}. Currently {row.stockQty} on hand.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Change">
            <Select value={mode} onValueChange={(v) => setMode(v as "add" | "set")}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add or remove</SelectItem>
                <SelectItem value="set">Set count to</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={mode === "add" ? "Amount (negative removes)" : "New count"}>
            <Input type="number" autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="Reason">
            <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESTOCK">Restock</SelectItem>
                <SelectItem value="ADJUSTMENT">Count correction</SelectItem>
                <SelectItem value="RETURN">Customer return</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Note (optional)">
            <Input value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
        {valid && (
          <p className="text-sm text-muted-foreground">
            Stock will be <span className="font-medium text-foreground tabular-nums">{after}</span>
            {after < 0 && " — below zero"}.
          </p>
        )}
        <DialogFooter>
          <Button onClick={submit} disabled={pending || !valid}>
            {pending && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistorySheet({ row, onClose }: { row: InventoryRow; onClose: () => void }) {
  const [movements, setMovements] = useState<MovementRow[] | null>(null);

  useEffect(() => {
    let live = true;
    void loadMovements({ variantId: row.id }).then((res) => live && setMovements(res.ok ? res.data : []));
    return () => {
      live = false;
    };
  }, [row.id]);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Stock history</SheetTitle>
          <SheetDescription>
            {row.productName} — {row.title || row.sku}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {movements === null ? (
            <Loader2 className="mx-auto mt-8 animate-spin text-muted-foreground" />
          ) : movements.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">No stock changes recorded yet.</p>
          ) : (
            <ol className="divide-y">
              {movements.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{REASON_LABELS[m.reason] ?? m.reason}</p>
                    {m.orderId ? (
                      <Link href={`/admin/orders/${m.orderId}`} className="text-xs text-muted-foreground hover:underline">
                        {m.note ?? "View order"}
                      </Link>
                    ) : (
                      m.note && <p className="text-xs text-muted-foreground">{m.note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <p className={m.delta > 0 ? "text-green-700" : "text-red-700"}>{m.delta > 0 ? `+${m.delta}` : m.delta}</p>
                    <p className="text-xs text-muted-foreground">→ {m.balance}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BulkActions({ selected, clear }: { selected: InventoryRow[]; clear: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(trackInventory: boolean) {
    start(async () => {
      const res = await setTracking({ ids: selected.map((r) => r.id), trackInventory });
      if (!res.ok) return void toast.error(res.error);
      toast.success(`${res.data.count} variant(s) updated`);
      clear();
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(true)}>
        Track stock
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(false)}>
        Stop tracking
      </Button>
    </>
  );
}

export function InventoryTable({ rows, total }: { rows: InventoryRow[]; total: number }) {
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);
  const [history, setHistory] = useState<InventoryRow | null>(null);

  const columns: ColumnDef<InventoryRow>[] = [
    {
      id: "product",
      header: () => <ColumnHeader id="product" title="Variant" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
            {row.original.image && (
              // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail
              <img src={row.original.image} alt="" className="size-full object-cover" />
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/catalog/products/${row.original.productId}`} className="block truncate font-medium text-navy hover:underline">
              {row.original.productName}
            </Link>
            <span className="block truncate text-xs text-muted-foreground">
              {[row.original.title, row.original.sku].filter(Boolean).join(" · ")}
              {!row.original.active && " · inactive"}
            </span>
          </div>
        </div>
      ),
    },
    { id: "status", header: "Status", cell: ({ row }) => <StockBadge row={row.original} /> },
    {
      id: "stockQty",
      header: () => <ColumnHeader id="stockQty" title="On hand" />,
      cell: ({ row }) =>
        row.original.trackInventory ? (
          <span className={`tabular-nums ${row.original.stockQty < 0 ? "text-red-700" : ""}`}>{row.original.stockQty}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { id: "threshold", header: "Alert at", cell: ({ row }) => <ThresholdInput key={row.original.lowStockThreshold} row={row.original} /> },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-1">
          <Button size="sm" variant="outline" disabled={!row.original.trackInventory} onClick={() => setAdjusting(row.original)}>
            Adjust
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label="Stock history" onClick={() => setHistory(row.original)}>
            <History />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        total={total}
        getRowId={(r) => r.id}
        searchPlaceholder="Search product, variant or SKU…"
        filters={[
          {
            key: "stock",
            label: "Stock",
            options: [
              { value: "low", label: "Low (at or below alert)" },
              { value: "out", label: "Out of stock" },
              { value: "tracked", label: "Tracked" },
              { value: "untracked", label: "Not tracked" },
            ],
          },
        ]}
        emptyMessage="No variants match."
        bulkActions={(selected, clear) => <BulkActions selected={selected} clear={clear} />}
      />
      {adjusting && <AdjustDialog row={adjusting} onClose={() => setAdjusting(null)} />}
      {history && <HistorySheet key={history.id} row={history} onClose={() => setHistory(null)} />}
    </>
  );
}
