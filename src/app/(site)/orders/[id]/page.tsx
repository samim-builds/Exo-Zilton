import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/site/Button";
import { WhatsAppIcon } from "@/components/site/WhatsAppIcon";
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
    <div className="pt-14 pb-20 sm:pt-20 sm:pb-28">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <p className="flex items-center gap-2 text-sm text-emerald-800">
          <CheckCircle2 className="size-4" aria-hidden />
          Order received
        </p>
        <h1 className="mt-3 text-4xl text-ink sm:text-5xl">
          Thank you, {order.name.split(" ")[0]}.
        </h1>
        <p className="mt-5 max-w-prose text-base text-stone sm:text-lg">
          {cod
            ? "We've received your order and will call or WhatsApp you to confirm before dispatch. Payment is cash on delivery."
            : "We've received your order and will email you within one business day with a shipping quote and secure payment link."}
        </p>
        <p className="mt-3 text-sm text-stone">
          Order number <span className="tabular font-medium text-ink">{order.number}</span>. A confirmation is on its way to {order.email}.
        </p>

        <div className="tabular mt-10 rounded-[6px] bg-glaze/50 p-6 sm:p-8">
          <ul className="space-y-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 text-[0.9375rem] text-ink">
                <span>
                  {item.productName}
                  {item.quantity > 1 && <span className="text-stone"> × {item.quantity}</span>}
                </span>
                <span className="shrink-0">{formatMoney(item.unitPrice * item.quantity, order.currency)}</span>
              </li>
            ))}
          </ul>
          {orderAdjustments(order).map((line) => (
            <div key={line.label} className="mt-3 flex justify-between gap-4 text-[0.9375rem] text-emerald-800">
              <span>{line.label}</span>
              <span className="shrink-0">-{formatMoney(-line.amount, order.currency)}</span>
            </div>
          ))}
          <div className="mt-4 flex justify-between border-t border-ink/10 pt-4 text-lg font-medium text-ink">
            <span>Total</span>
            <span>
              {formatMoney(order.total, order.currency)}
              {cod ? "" : " + shipping"}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/products" className={buttonVariants({ size: "lg" })}>
            Continue shopping
          </Link>
          <a
            href={buildGeneralWhatsAppUrl(`Hi Exo Zilton, I have a question about order #${order.number}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            <WhatsAppIcon />
            Ask about this order
          </a>
        </div>
      </div>
    </div>
  );
}
