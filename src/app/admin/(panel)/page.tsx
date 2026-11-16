import Link from "next/link";
import { ArrowRight, ClipboardList, Package, TriangleAlert, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/order-schema";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { PageHeader } from "@/components/admin/shell/PageHeader";

export const metadata = {
  title: "Admin Dashboard | Exo Zilton",
  robots: { index: false, follow: false },
};

const DAY = 24 * 60 * 60 * 1000;

async function getOrderStats() {
  const since = new Date(Date.now() - 30 * DAY);
  const [pending, recentCount, revenue, recentOrders, activity] = await Promise.all([
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.count({ where: { createdAt: { gte: since }, status: { not: "CANCELLED" } } }),
    prisma.order.groupBy({
      by: ["currency"],
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, number: true, name: true, total: true, currency: true, status: true, createdAt: true },
    }),
    // Kept separate so order stats still load if the activity table isn't migrated yet.
    prisma.activityLog
      .findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, summary: true, createdAt: true } })
      .catch(() => []),
  ]);

  const revenueBy = (currency: string) => revenue.find((r) => r.currency === currency)?._sum.total ?? 0;
  return { pending, recentCount, pkr: revenueBy("PKR"), usd: revenueBy("USD"), recentOrders, activity };
}

async function getCatalogStats() {
  const [active, outOfStock] = await Promise.all([
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.productVariant.count({
      where: { active: true, trackInventory: true, stockQty: { lte: 0 }, product: { status: "ACTIVE" } },
    }),
  ]);
  return { active, outOfStock };
}

function relativeTime(date: Date): string {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function AdminDashboardPage() {
  const dbConfigured = Boolean(process.env.DATABASE_URL);
  const [catalog, stats] = await Promise.all([
    dbConfigured ? getCatalogStats().catch(() => null) : null,
    dbConfigured ? getOrderStats().catch(() => null) : null,
  ]);

  const kpis = [
    {
      label: "Pending orders",
      value: stats?.pending ?? "—",
      hint: "Awaiting confirmation",
      icon: TriangleAlert,
      href: "/admin/orders?status=PENDING",
    },
    {
      label: "Orders · 30 days",
      value: stats?.recentCount ?? "—",
      hint: "Excluding cancelled",
      icon: ClipboardList,
      href: "/admin/orders",
    },
    {
      label: "Revenue · 30 days",
      value: stats ? formatMoney(stats.pkr, "PKR") : "—",
      hint: stats ? `+ ${formatMoney(stats.usd, "USD")} international` : "Excluding cancelled",
      icon: Wallet,
      href: "/admin/orders",
    },
    {
      label: "Products",
      value: catalog?.active ?? "—",
      hint: catalog ? `${catalog.outOfStock} variant(s) out of stock` : "Active products",
      icon: Package,
      href: "/admin/catalog/products",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Orders, revenue and catalog at a glance."
        actions={
          <Button asChild>
            <Link href="/admin/catalog/products/new">Add product</Link>
          </Button>
        }
      />

      {!dbConfigured && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Database not connected.</strong> Add <code className="rounded bg-white px-1">DATABASE_URL</code> to
          your environment, run <code className="rounded bg-white px-1">npx prisma migrate dev</code> and{" "}
          <code className="rounded bg-white px-1">npx prisma db seed</code> to enable saving changes.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring">
            <Card className="h-full gap-2 transition-colors group-hover:border-primary/30">
              <CardHeader>
                <CardDescription>{kpi.label}</CardDescription>
                <CardAction>
                  <kpi.icon className="size-4 text-muted-foreground" />
                </CardAction>
                <CardTitle className="text-2xl tabular-nums">{kpi.value}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{kpi.hint}</CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent orders</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/orders">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {!stats || stats.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <ul className="divide-y">
                {stats.recentOrders.map((order) => (
                  <li key={order.id}>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-3 py-2.5 text-sm hover:text-navy"
                    >
                      <span className="w-14 font-medium">#{order.number}</span>
                      <span className="min-w-0 flex-1 truncate">{order.name}</span>
                      <span className="hidden text-muted-foreground sm:inline">{relativeTime(order.createdAt)}</span>
                      <span className="w-28 text-right tabular-nums">{formatMoney(order.total, order.currency)}</span>
                      <OrderStatusBadge status={order.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/activity">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {!stats || stats.activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Changes you make will show up here.</p>
            ) : (
              <ul className="space-y-3">
                {stats.activity.map((entry) => (
                  <li key={entry.id} className="flex justify-between gap-4 text-sm">
                    <span className="min-w-0 truncate">{entry.summary}</span>
                    <span className="shrink-0 text-muted-foreground">{relativeTime(entry.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
