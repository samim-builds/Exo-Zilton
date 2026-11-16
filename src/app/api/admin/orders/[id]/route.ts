import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderUpdateSchema } from "@/lib/order-schema";
import { requireAdmin } from "@/lib/session";
import { diffFields, logActivity } from "@/lib/admin/activity";
import { releaseOrderIncentives } from "@/lib/commerce/checkout";
import { applyOrderTransition } from "@/lib/catalog/inventory-server";
import { reinstateBlockedReason } from "@/lib/catalog/inventory";
import { CATALOG_TAG } from "@/lib/products-server";
import { revalidateTag } from "next/cache";

// Another admin changed the status between reading and writing this order.
class StatusConflict extends Error {}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const parsed = orderUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order update" }, { status: 400 });
  }

  const { courier, trackingNumber, ...rest } = parsed.data;

  const before = await prisma.order.findUnique({
    where: { id },
    select: { number: true, status: true, paid: true, courier: true, trackingNumber: true, voucherAmount: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  const blocked = rest.status ? reinstateBlockedReason(before.status, rest.status, before) : null;
  if (blocked) return NextResponse.json({ error: blocked }, { status: 409 });

  try {
    const order = await prisma.$transaction(async (tx) => {
      // The write itself is conditional on the status we read. A concurrent request
      // waits on this row's lock, then matches nothing, so stock and voucher
      // refunds happen exactly once.
      const written = await tx.order.updateMany({
        where: { id, status: before.status },
        data: {
          status: rest.status ?? before.status,
          ...(rest.paid !== undefined && { paid: rest.paid }),
          ...(courier !== undefined && { courier: courier || null }),
          ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
        },
      });
      if (written.count === 0) throw new StatusConflict();
      const updated = await tx.order.findUniqueOrThrow({ where: { id } });
      // Cancelling frees the discount use and refunds any gift voucher balance.
      if (updated.status === "CANCELLED" && before.status !== "CANCELLED") {
        await releaseOrderIncentives(tx, id);
      }
      await applyOrderTransition(tx, id, before.status, updated.status, before.number);
      return updated;
    });

    const diff = diffFields(before, {
      status: order.status,
      paid: order.paid,
      courier: order.courier,
      trackingNumber: order.trackingNumber,
    });
    if (Object.keys(diff).length > 0) {
      await logActivity({
        entityType: "order",
        entityId: order.id,
        action: diff.status ? "STATUS" : "UPDATE",
        summary: diff.status
          ? `Order #${before.number} marked ${order.status.toLowerCase()}`
          : `Updated order #${before.number}`,
        diff,
      });
    }

    // Stock levels decide what the storefront shows as in stock.
    if (order.status !== before.status) revalidateTag(CATALOG_TAG, { expire: 0 });

    return NextResponse.json({ id: order.id, status: order.status });
  } catch (error) {
    if (error instanceof StatusConflict) {
      return NextResponse.json({ error: "This order was just updated elsewhere. Reload and try again." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: "Couldn't update the order." }, { status: 500 });
  }
}
