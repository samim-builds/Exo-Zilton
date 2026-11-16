"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable, type TableFilter } from "@/components/admin/data-table/DataTable";
import { ColumnHeader } from "@/components/admin/data-table/ColumnHeader";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { formatMoney, ORDER_STATUSES } from "@/lib/order-schema";

export type OrderRow = {
  id: string;
  number: number;
  createdAt: Date;
  name: string;
  email: string;
  location: string;
  itemCount: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paid: boolean;
  status: string;
};

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const filters: TableFilter[] = [
  { key: "status", label: "Status", options: ORDER_STATUSES.map((s) => ({ value: s, label: titleCase(s) })) },
  {
    key: "payment",
    label: "Payment",
    options: [
      { value: "COD", label: "Cash on delivery" },
      { value: "PAY_ON_CONFIRMATION", label: "Pay on confirmation" },
    ],
  },
  {
    key: "paid",
    label: "Paid",
    options: [
      { value: "yes", label: "Paid" },
      { value: "no", label: "Unpaid" },
    ],
  },
  {
    key: "currency",
    label: "Market",
    options: [
      { value: "PKR", label: "Pakistan (PKR)" },
      { value: "USD", label: "International (USD)" },
    ],
  },
];

const columns: ColumnDef<OrderRow>[] = [
  {
    id: "number",
    header: () => <ColumnHeader id="number" title="Order" />,
    cell: ({ row }) => (
      <Link href={`/admin/orders/${row.original.id}`} className="font-medium text-navy hover:underline">
        #{row.original.number}
      </Link>
    ),
  },
  {
    id: "createdAt",
    header: () => <ColumnHeader id="createdAt" title="Date" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {row.original.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </span>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium">{row.original.name}</p>
        <p className="truncate text-xs text-muted-foreground">{row.original.location}</p>
      </div>
    ),
  },
  { id: "items", header: "Items", cell: ({ row }) => row.original.itemCount },
  {
    id: "total",
    header: () => <ColumnHeader id="total" title="Total" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        <p className="font-medium">{formatMoney(row.original.total, row.original.currency)}</p>
        <p className="text-xs text-muted-foreground">
          {row.original.paymentMethod === "COD" ? "COD" : "Pay on confirmation"} ·{" "}
          {row.original.paid ? "Paid" : "Unpaid"}
        </p>
      </div>
    ),
  },
  { id: "status", header: "Status", cell: ({ row }) => <OrderStatusBadge status={row.original.status} /> },
];

export function OrdersTable({ rows, total }: { rows: OrderRow[]; total: number }) {
  return (
    <DataTable
      columns={columns}
      data={rows}
      total={total}
      getRowId={(row) => row.id}
      searchPlaceholder="Search order #, name, email, phone…"
      filters={filters}
      emptyMessage="No orders yet. Orders placed through the website checkout appear here."
    />
  );
}
