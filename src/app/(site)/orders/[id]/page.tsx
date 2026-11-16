import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatMoney, orderAdjustments } from "@/lib/order-schema";
import { buildGeneralWhatsAppUrl } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order received | Exo Zilton",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderConfirmationPage({ params }: PageProps) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });

  if (!order) {
    notFound();
  }

  const cod = order.paymentMethod === "COD";

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <p className="font-sans text-[11px] uppercase tracking-[0.2em] text-bronze">Order #{order.number}</p>
        <h1 className="mt-3 font-serif text-4xl font-light tracking-tight text-navy">
          Thank you, {order.name.split(" ")[0]}.
        </h1>
        <p className="mt-4 font-sans text-[16px] leading-[1.7] text-charcoal">
          {cod
            ? "We've received your order and will call or WhatsApp you to confirm before dispatch. Payment is cash on delivery."
            : "We've received your order and will email you within one business day with a shipping quote and secure payment link."}
        </p>
        <p className="mt-2 font-sans text-[13px] text-muted">A confirmation has been sent to {order.email}.</p>

        <div className="mt-10 border border-hairline bg-white p-6">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 font-sans text-[14px] text-charcoal">
                <span>{item.quantity} × {item.productName}</span>
                <span className="shrink-0">{formatMoney(item.unitPrice * item.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>
          {orderAdjustments(order).map((line) => (
            <div key={line.label} className="mt-3 flex justify-between gap-4 font-sans text-[14px] text-bronze">
              <span>{line.label}</span>
              <span className="shrink-0">-{formatMoney(-line.amount, order.currency)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t border-hairline pt-4 font-sans text-[16px] text-navy">
            <span>Total</span>
            <span>
              {formatMoney(order.total, order.currency)}
              {cod ? "" : " + shipping"}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/products"
            className="inline-flex justify-center border border-navy bg-navy px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-white transition-colors hover:border-bronze hover:bg-bronze"
          >
            Continue shopping
          </Link>
          <a
            href={buildGeneralWhatsAppUrl(`Hi Exo Zilton, I have a question about order #${order.number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex justify-center border border-hairline px-6 py-4 font-sans text-[11px] uppercase tracking-[0.16em] text-navy transition-colors hover:border-bronze"
          >
            Questions? WhatsApp us
          </a>
        </div>
      </div>
    </div>
  );
}
