import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { adjustmentDelta, stockMovementsForTransition, type OrderStatusName, type StockAdjustment } from "./inventory";

type Tx = Prisma.TransactionClient;

type MovementInput = {
  variantId: string;
  delta: number;
  reason: "ORDER" | "CANCEL" | "RESTOCK" | "ADJUSTMENT" | "RETURN";
  orderId?: string | null;
  note?: string | null;
};

/** Moves stock and records each movement with the resulting balance. Call inside a transaction. */
export async function applyMovements(tx: Tx, movements: MovementInput[]): Promise<void> {
  for (const m of movements) {
    if (m.delta === 0) continue;
    const variant = await tx.productVariant.update({
      where: { id: m.variantId },
      data: { stockQty: { increment: m.delta } },
      select: { stockQty: true },
    });
    await tx.inventoryMovement.create({
      data: { variantId: m.variantId, delta: m.delta, balance: variant.stockQty, reason: m.reason, orderId: m.orderId ?? null, note: m.note ?? null },
    });
  }
}

/** Stock changes for an order moving between statuses (see stockMovementsForTransition). */
export async function applyOrderTransition(tx: Tx, orderId: string, from: OrderStatusName, to: OrderStatusName, orderNumber?: number) {
  if (from === to) return;
  const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
  const variantIds = [...new Set(items.flatMap((i) => (i.variantId ? [i.variantId] : [])))];
  const tracked = await tx.productVariant.findMany({ where: { id: { in: variantIds }, trackInventory: true }, select: { id: true } });
  const movements = stockMovementsForTransition(from, to, items, new Set(tracked.map((v) => v.id)));
  const note = orderNumber ? `Order #${orderNumber} ${to.toLowerCase()}` : null;
  await applyMovements(
    tx,
    movements.map((m) => ({ ...m, orderId, note })),
  );
}

/** Manual stock change from the admin. Returns the new stock level. */
export async function adjustVariantStock(
  tx: Tx,
  variantId: string,
  adjustment: StockAdjustment,
  reason: "RESTOCK" | "ADJUSTMENT" | "RETURN",
  note: string | null,
): Promise<number> {
  const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId }, select: { stockQty: true } });
  const delta = adjustmentDelta(adjustment, variant.stockQty);
  await applyMovements(tx, [{ variantId, delta, reason, note }]);
  return variant.stockQty + delta;
}
