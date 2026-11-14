import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";
import { formatMoney } from "@/lib/order-schema";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";

export const metadata = {
  title: "Orders | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminOrdersPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold text-navy">Orders</h1>
        <p className="mt-1 text-sm text-charcoal/70">Confirm, ship, and track customer orders</p>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-lg border border-charcoal/10 bg-white p-6 text-sm text-charcoal/70">
          No orders yet. Orders placed through the website checkout appear here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-charcoal/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-charcoal/10 bg-cream/50">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-charcoal/5">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-navy underline">
                      #{order.number}
                    </Link>
                    <p className="text-xs text-charcoal/60">{order.createdAt.toLocaleDateString("en-GB")}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-navy">{order.name}</p>
                    <p className="text-xs text-charcoal/60">{order.city}, {order.country}</p>
                  </td>
                  <td className="px-4 py-3">{order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td className="px-4 py-3">
                    {formatMoney(order.total, order.currency)}
                    <p className="text-xs text-charcoal/60">
                      {order.paymentMethod === "COD" ? "COD" : "Pay on confirmation"} · {order.paid ? "Paid" : "Unpaid"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
