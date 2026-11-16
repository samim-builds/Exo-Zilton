import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderUpdateSchema } from "@/lib/order-schema";
import { requireAdmin } from "@/lib/session";
import { diffFields, logActivity } from "@/lib/admin/activity";
import { releaseOrderIncentives } from "@/lib/commerce/checkout";

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
    select: { number: true, status: true, paid: true, courier: true, trackingNumber: true },
  });
  if (!before) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id },
        data: {
          ...rest,
          ...(courier !== undefined && { courier: courier || null }),
          ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
        },
      });
      // Cancelling frees the discount use and refunds any gift voucher balance.
      if (updated.status === "CANCELLED" && before.status !== "CANCELLED") {
        await releaseOrderIncentives(tx, id);
      }
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

    return NextResponse.json({ id: order.id, status: order.status });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
