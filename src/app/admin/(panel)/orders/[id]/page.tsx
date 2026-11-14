import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";
import { formatMoney } from "@/lib/order-schema";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { OrderUpdateForm } from "@/components/admin/OrderUpdateForm";

export const metadata = {
  title: "Order | Admin",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminOrderDetailPage({ params }: PageProps) {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });

  if (!order) {
    notFound();
  }

  const phoneDigits = order.phone.replace(/\D/g, "");

  return (
    <div>
      <Link href="/admin/orders" className="text-sm text-charcoal/70 hover:text-navy">
        ← All orders
      </Link>
      <div className="mt-2 mb-6 flex items-center gap-4">
        <h1 className="font-serif text-3xl font-semibold text-navy">Order #{order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-charcoal/10 bg-white p-6">
            <h2 className="mb-4 font-medium text-navy">Items</h2>
            <ul className="space-y-2 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>
                    {item.quantity} × {item.productName}{" "}
                    <span className="text-charcoal/60">({item.sku})</span>
                  </span>
                  <span>{formatMoney(item.unitPrice * item.quantity, order.currency)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-charcoal/10 pt-4 font-medium text-navy">
              <span>Total</span>
              <span>{formatMoney(order.total, order.currency)}</span>
            </div>
            <p className="mt-2 text-xs text-charcoal/60">
              {order.paymentMethod === "COD"
                ? "Cash on delivery"
                : "International — send shipping quote and payment link"}
            </p>
          </section>

          <section className="rounded-lg border border-charcoal/10 bg-white p-6 text-sm">
            <h2 className="mb-4 font-medium text-navy">Customer & delivery</h2>
            <p className="text-navy">{order.name}</p>
            <p>
              <a href={`mailto:${order.email}`} className="underline">{order.email}</a>
            </p>
            <p className="mb-3">
              {order.phone} ·{" "}
              <a
                href={`https://wa.me/${phoneDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                WhatsApp
              </a>
            </p>
            <p>{order.addressLine}</p>
            <p>{[order.city, order.postalCode].filter(Boolean).join(" ")}</p>
            <p>{order.country}</p>
            {order.notes && (
              <p className="mt-3 rounded-md bg-cream/50 p-3 text-charcoal/80">Notes: {order.notes}</p>
            )}
            <p className="mt-3 text-xs text-charcoal/60">
              Placed {order.createdAt.toLocaleString("en-GB")}
            </p>
          </section>
        </div>

        <section className="h-fit rounded-lg border border-charcoal/10 bg-white p-6">
          <h2 className="mb-4 font-medium text-navy">Update order</h2>
          <OrderUpdateForm
            orderId={order.id}
            status={order.status}
            paid={order.paid}
            courier={order.courier}
            trackingNumber={order.trackingNumber}
          />
        </section>
      </div>
    </div>
  );
}
