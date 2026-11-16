"use client";

import { useEffect, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ListFilter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_SIZES } from "@/lib/admin/table-params";
import { cn } from "@/lib/utils";
import { useTableUrl } from "./use-table-url";

export type TableFilter = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
};

type DataTableProps<T> = {
  columns: ColumnDef<T>[];
  data: T[];
  total: number;
  getRowId: (row: T) => string;
  searchPlaceholder?: string;
  filters?: TableFilter[];
  emptyMessage?: string;
  /** Rendered in a toolbar while rows are selected; enables the checkbox column. */
  bulkActions?: (selected: T[], clear: () => void) => React.ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  total,
  getRowId,
  searchPlaceholder = "Search…",
  filters = [],
  emptyMessage = "No results.",
  bulkActions,
}: DataTableProps<T>) {
  const { searchParams, update, isPending } = useTableUrl();
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Number(searchParams.get("per")) || 25;
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  const allColumns: ColumnDef<T>[] = bulkActions
    ? [
        {
          id: "_select",
          header: ({ table }) => (
            <Checkbox
              aria-label="Select all rows"
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              aria-label="Select row"
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            />
          ),
          size: 32,
        },
        ...columns,
      ]
    : columns;

  // Data is already sorted, filtered and paginated on the server.
  const table = useReactTable({
    data,
    columns: allColumns,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: { rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: Boolean(bulkActions),
  });

  // Selection only makes sense for the rows currently shown.
  useEffect(() => setRowSelection({}), [data]);

  const selected = table.getSelectedRowModel().rows.map((r) => r.original);
  const activeFilterCount = filters.filter((f) => searchParams.get(f.key)).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder={searchPlaceholder} initial={searchParams.get("q") ?? ""} onSearch={(q) => update({ q })} />
        {filters.map((filter) => (
          <FilterMenu
            key={filter.key}
            filter={filter}
            selected={(searchParams.get(filter.key) ?? "").split(",").filter(Boolean)}
            onChange={(values) => update({ [filter.key]: values.join(",") })}
          />
        ))}
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => update(Object.fromEntries(filters.map((f) => [f.key, null])))}>
            Reset
            <X />
          </Button>
        )}
      </div>

      {bulkActions && selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
          <span className="font-medium">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">{bulkActions(selected, () => setRowSelection({}))}</div>
        </div>
      )}

      <div className={cn("overflow-hidden rounded-md border bg-background transition-opacity", isPending && "opacity-60")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-muted/50 hover:bg-muted/50">
                {group.headers.map((header) => (
                  <TableHead key={header.id} style={header.column.id === "_select" ? { width: 40 } : undefined}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="h-32 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {total === 0
            ? "0 results"
            : `${(page - 1) * perPage + 1}–${Math.min(page * perPage, total)} of ${total}`}
        </span>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline">Rows per page</span>
          <Select value={String(perPage)} onValueChange={(per) => update({ per })}>
            <SelectTrigger size="sm" className="w-20" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="px-2">
            Page {page} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) }, { resetPage: false })}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => update({ page: String(page + 1) }, { resetPage: false })}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

function SearchInput({
  placeholder,
  initial,
  onSearch,
}: {
  placeholder: string;
  initial: string;
  onSearch: (q: string) => void;
}) {
  const [value, setValue] = useState(initial);

  // Debounce so typing doesn't trigger a server round-trip per keystroke.
  useEffect(() => {
    if (value === initial) return;
    const id = setTimeout(() => onSearch(value.trim()), 300);
    return () => clearTimeout(id);
  }, [value, initial, onSearch]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="h-8 bg-background pl-8"
        aria-label="Search"
      />
    </div>
  );
}

function FilterMenu({
  filter,
  selected,
  onChange,
}: {
  filter: TableFilter;
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  function toggle(value: string, checked: boolean) {
    onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed bg-background">
          <ListFilter />
          {filter.label}
          {selected.length > 0 && (
            <span className="rounded-sm bg-secondary px-1.5 text-xs font-normal">{selected.length}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuLabel>{filter.label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {filter.options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, Boolean(checked))}
            onSelect={(e) => e.preventDefault()}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
