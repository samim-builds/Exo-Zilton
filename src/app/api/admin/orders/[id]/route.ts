import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { orderUpdateSchema } from "@/lib/order-schema";
import { requireAdmin } from "@/lib/session";

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

  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        ...rest,
        ...(courier !== undefined && { courier: courier || null }),
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
      },
    });
    return NextResponse.json({ id: order.id, status: order.status });
  } catch {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
}
