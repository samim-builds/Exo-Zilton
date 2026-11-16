"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Copy, ImageOff, MoreHorizontal, Pencil, Star } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnHeader } from "@/components/admin/data-table/ColumnHeader";
import { DataTable } from "@/components/admin/data-table/DataTable";
import { MediaThumb } from "@/components/admin/media/MediaLibrary";
import type { ProductListRow } from "@/lib/catalog/admin-queries";
import { formatPriceRange } from "@/lib/catalog/pricing";
import { deleteProducts, duplicateProduct, setProductsStatus } from "./actions";

export const STATUS_STYLES: Record<ProductListRow["status"], string> = {
  ACTIVE: "border-green-200 bg-green-50 text-green-800",
  DRAFT: "border-zinc-200 bg-zinc-50 text-zinc-700",
  ARCHIVED: "border-amber-200 bg-amber-50 text-amber-800",
};

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function RowActions({ row }: { row: ProductListRow }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function duplicate() {
    start(async () => {
      const res = await duplicateProduct({ id: row.id });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Draft copy created");
      router.push(`/admin/catalog/products/${res.data.id}`);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`} disabled={pending}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/catalog/products/${row.id}`}>
            <Pencil />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={duplicate}>
          <Copy />
          Duplicate
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const columns: ColumnDef<ProductListRow>[] = [
  {
    id: "name",
    header: () => <ColumnHeader id="name" title="Product" />,
    cell: ({ row }) => (
      <Link href={`/admin/catalog/products/${row.original.id}`} className="flex items-center gap-3">
        {row.original.image ? (
          <MediaThumb item={{ url: row.original.image, alt: row.original.name }} className="size-10 shrink-0" />
        ) : (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <ImageOff className="size-4" />
          </span>
        )}
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 font-medium text-navy hover:underline">
            {row.original.name}
            {row.original.featured && <Star className="size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />}
          </span>
          <span className="block truncate text-xs text-muted-foreground">/{row.original.slug}</span>
        </span>
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className={STATUS_STYLES[row.original.status]}>
        {titleCase(row.original.status)}
      </Badge>
    ),
  },
  {
    id: "category",
    header: "Category",
    cell: ({ row }) => row.original.category ?? <span className="text-muted-foreground">—</span>,
  },
  {
    id: "variants",
    header: "Variants",
    cell: ({ row }) => <span className="tabular-nums">{row.original.variantCount || "—"}</span>,
  },
  {
    id: "price",
    header: "Price",
    cell: ({ row }) =>
      row.original.minPKR === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        <span className="whitespace-nowrap tabular-nums">
          {formatPriceRange(row.original.minPKR, row.original.maxPKR ?? row.original.minPKR, "PKR")}
        </span>
      ),
  },
  {
    id: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const { stock } = row.original;
      if (!stock.tracked) return <span className="text-muted-foreground">Not tracked</span>;
      return (
        <span className={stock.outOfStock > 0 ? "text-amber-700" : undefined}>
          {stock.total} in stock
          {stock.outOfStock > 0 && <span className="block text-xs">{stock.outOfStock} variant(s) out</span>}
        </span>
      );
    },
  },
  {
    id: "updatedAt",
    header: () => <ColumnHeader id="updatedAt" title="Updated" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.updatedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </span>
    ),
  },
  { id: "actions", header: "", cell: ({ row }) => <RowActions row={row.original} /> },
];

function BulkActions({ selected, clear }: { selected: ProductListRow[]; clear: () => void }) {
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
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setProductsStatus({ ids, status: "ACTIVE" }), "published")}>
        Publish
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setProductsStatus({ ids, status: "DRAFT" }), "moved to draft")}>
        Unpublish
      </Button>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setProductsStatus({ ids, status: "ARCHIVED" }), "archived")}>
        Archive
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" disabled={pending}>
            Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.length} product(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Products that appear on past orders can&apos;t be deleted; archive those instead. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => run(() => deleteProducts({ ids }), "deleted")}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ProductsTable({
  rows,
  total,
  categories,
}: {
  rows: ProductListRow[];
  total: number;
  categories: { id: string; name: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      getRowId={(r) => r.id}
      searchPlaceholder="Search name, slug or SKU…"
      filters={[
        {
          key: "status",
          label: "Status",
          options: [
            { value: "ACTIVE", label: "Active" },
            { value: "DRAFT", label: "Draft" },
            { value: "ARCHIVED", label: "Archived" },
          ],
        },
        {
          key: "category",
          label: "Category",
          options: [...categories.map((c) => ({ value: c.id, label: c.name })), { value: "none", label: "Uncategorised" }],
        },
      ]}
      emptyMessage="No products match."
      bulkActions={(selected, clear) => <BulkActions selected={selected} clear={clear} />}
    />
  );
}
