// Pure stock rules. Stock is taken when an order becomes committed (confirmed,
// shipped or delivered) and returned when it leaves that state (cancelled, or
// moved back to pending). Only variants with trackInventory move.

export type OrderStatusName = "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const COMMITTED = new Set<OrderStatusName>(["CONFIRMED", "SHIPPED", "DELIVERED"]);

export const isCommitted = (status: OrderStatusName) => COMMITTED.has(status);

type Line = { variantId: string | null; quantity: number };

function sumByVariant(lines: Line[], include: (variantId: string) => boolean): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    if (!line.variantId || !include(line.variantId)) continue;
    totals.set(line.variantId, (totals.get(line.variantId) ?? 0) + line.quantity);
  }
  return totals;
}

export type StockMovement = { variantId: string; delta: number; reason: "ORDER" | "CANCEL" };

export function stockMovementsForTransition(
  from: OrderStatusName,
  to: OrderStatusName,
  lines: Line[],
  tracked: Set<string>,
): StockMovement[] {
  const wasCommitted = isCommitted(from);
  const nowCommitted = isCommitted(to);
  if (wasCommitted === nowCommitted) return [];
  const sign = nowCommitted ? -1 : 1;
  return [...sumByVariant(lines, (id) => tracked.has(id))].map(([variantId, quantity]) => ({
    variantId,
    delta: sign * quantity,
    reason: nowCommitted ? "ORDER" : "CANCEL",
  }));
}

export type StockLevel = { trackInventory: boolean; stockQty: number };

/** Tracked variants the cart asks for more of than is on hand. */
export function stockShortfalls(lines: Line[], stock: Map<string, StockLevel>) {
  return [...sumByVariant(lines, (id) => Boolean(stock.get(id)?.trackInventory))].flatMap(([variantId, requested]) => {
    const available = Math.max(0, stock.get(variantId)!.stockQty);
    return requested > available ? [{ variantId, requested, available }] : [];
  });
}

export type StockAdjustment = { mode: "set" | "add"; value: number };

export function adjustmentDelta(adjustment: StockAdjustment, current: number): number {
  return adjustment.mode === "set" ? adjustment.value - current : adjustment.value;
}

export function isLowStock(v: { trackInventory: boolean; stockQty: number; lowStockThreshold: number }): boolean {
  return v.trackInventory && v.stockQty <= v.lowStockThreshold;
}
