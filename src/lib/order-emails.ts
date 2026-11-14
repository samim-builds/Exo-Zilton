import type { Order, OrderItem } from "@/generated/prisma/client";
import { sendEmail } from "./email";
import { formatMoney } from "./order-schema";
import { siteConfig } from "./site";

type OrderWithItems = Order & { items: OrderItem[] };

function orderSummary(order: OrderWithItems): string {
  const lines = order.items.map(
    (item) =>
      `${item.quantity} × ${item.productName} (${item.size}) — ${formatMoney(item.unitPrice * item.quantity, order.currency)}`,
  );

  return [
    ...lines,
    "",
    `Subtotal: ${formatMoney(order.subtotal, order.currency)}`,
    order.currency === "PKR"
      ? "Delivery: Free"
      : "Shipping: to be quoted",
    `Total: ${formatMoney(order.total, order.currency)}${order.currency === "PKR" ? "" : " + shipping"}`,
    "",
    "Deliver to:",
    order.name,
    order.addressLine,
    [order.city, order.postalCode].filter(Boolean).join(" "),
    order.country,
    order.phone,
  ].join("\n");
}

export async function sendOrderEmails(order: OrderWithItems): Promise<void> {
  const nextStep =
    order.paymentMethod === "COD"
      ? "We'll call or WhatsApp you to confirm, then dispatch your order. Payment is cash on delivery."
      : "We'll email you within one business day with a shipping quote and a secure payment link.";

  const results = await Promise.allSettled([
    sendEmail({
      to: order.email,
      replyTo: siteConfig.contactEmail,
      subject: `Your ${siteConfig.name} order #${order.number}`,
      text: [
        `Thank you, ${order.name}. We've received your order #${order.number}.`,
        "",
        nextStep,
        "",
        orderSummary(order),
        "",
        `Questions? Reply to this email or WhatsApp us at +${siteConfig.whatsappNumber}.`,
      ].join("\n"),
    }),
    sendEmail({
      to: siteConfig.contactEmail,
      replyTo: order.email,
      subject: `New order #${order.number} — ${formatMoney(order.total, order.currency)} (${order.paymentMethod})`,
      text: [
        `New order #${order.number} from ${order.name} <${order.email}>`,
        "",
        orderSummary(order),
        order.notes ? `\nNotes: ${order.notes}` : "",
        "",
        `Manage: ${siteConfig.url}/admin/orders/${order.id}`,
      ].join("\n"),
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("[Order email failed]", result.reason);
    }
  }
}
