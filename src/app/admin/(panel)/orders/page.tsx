import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { ORDER_STATUSES } from "@/lib/order-schema";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { OrdersTable } from "./OrdersTable";

export const metadata = {
  title: "Orders | Admin",
  robots: { index: false, follow: false },
};

const SORTABLE = ["createdAt", "number", "total"] as const;
const FILTERS = ["status", "payment", "paid", "currency"] as const;

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: SORTABLE,
    defaultSort: { id: "createdAt", desc: true },
    filters: FILTERS,
  });

  const { q, filters } = params;
  const asNumber = Number(q.replace(/^#/, ""));
  const where: Prisma.OrderWhereInput = {
    ...(q && {
      OR: [
        ...(Number.isInteger(asNumber) && asNumber > 0 ? [{ number: asNumber }] : []),
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
      ],
    }),
    ...(filters.status && {
      status: { in: filters.status.filter((s) => (ORDER_STATUSES as readonly string[]).includes(s)) as never },
    }),
    ...(filters.payment && {
      paymentMethod: { in: filters.payment.filter((p) => p === "COD" || p === "PAY_ON_CONFIRMATION") },
    }),
    ...(filters.paid?.length === 1 && { paid: filters.paid[0] === "yes" }),
    ...(filters.currency && { currency: { in: filters.currency } }),
  };

  const db = Boolean(process.env.DATABASE_URL);
  const [orders, total] = db
    ? await Promise.all([
        prisma.order.findMany({
          where,
          include: { items: { select: { quantity: true } } },
          orderBy: { [params.sort.id]: params.sort.desc ? "desc" : "asc" },
          skip: params.skip,
          take: params.take,
        }),
        prisma.order.count({ where }),
      ])
    : [[], 0];

  const rows = orders.map((o) => ({
    id: o.id,
    number: o.number,
    createdAt: o.createdAt,
    name: o.name,
    email: o.email,
    location: `${o.city}, ${o.country}`,
    itemCount: o.items.reduce((sum, i) => sum + i.quantity, 0),
    total: o.total,
    currency: o.currency,
    paymentMethod: o.paymentMethod,
    paid: o.paid,
    status: o.status,
  }));

  return (
    <div>
      <PageHeader title="Orders" description="Confirm, ship, and track customer orders." />
      <OrdersTable rows={rows} total={total} />
    </div>
  );
}
