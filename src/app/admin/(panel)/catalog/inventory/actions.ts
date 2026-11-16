"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { adjustVariantStock } from "@/lib/catalog/inventory-server";
import { listMovements } from "@/lib/catalog/inventory-queries";
import { CATALOG_TAG } from "@/lib/products-server";

const revalidate = { tags: [CATALOG_TAG], paths: ["/admin/catalog/inventory", "/admin"] };

export const adjustStock = adminAction(
  z.object({
    variantId: z.string().min(1),
    mode: z.enum(["set", "add"]),
    value: z.number().int().min(-100000).max(100000),
    reason: z.enum(["RESTOCK", "ADJUSTMENT", "RETURN"]),
    note: z.string().trim().max(300),
  }),
  async ({ variantId, mode, value, reason, note }) => {
    if (mode === "set" && value < 0) throw new AdminActionError("Stock can't be set below zero.");
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { sku: true, trackInventory: true } });
    if (!variant) throw new AdminActionError("This variant no longer exists.");
    if (!variant.trackInventory) throw new AdminActionError("Turn on stock tracking for this variant first.");

    const stockQty = await prisma.$transaction((tx) => adjustVariantStock(tx, variantId, { mode, value }, reason, note || null));
    await logActivity({
      entityType: "variant",
      entityId: variantId,
      action: "UPDATE",
      summary: `Stock for ${variant.sku} ${mode === "set" ? "set" : "adjusted"} to ${stockQty} (${reason.toLowerCase()})`,
    });
    return { stockQty };
  },
  revalidate,
);

export const setTracking = adminAction(
  z.object({ ids: z.array(z.string().min(1)).min(1).max(500), trackInventory: z.boolean() }),
  async ({ ids, trackInventory }) => {
    const { count } = await prisma.productVariant.updateMany({ where: { id: { in: ids } }, data: { trackInventory } });
    await logActivity({
      entityType: "variant",
      entityId: ids.join(","),
      action: "UPDATE",
      summary: `${trackInventory ? "Started" : "Stopped"} tracking stock for ${count} variant(s)`,
    });
    return { count };
  },
  revalidate,
);

export const setLowStockThreshold = adminAction(
  z.object({ variantId: z.string().min(1), lowStockThreshold: z.number().int().min(0).max(100000) }),
  async ({ variantId, lowStockThreshold }) => {
    await prisma.productVariant.update({ where: { id: variantId }, data: { lowStockThreshold } });
    return { lowStockThreshold };
  },
  { paths: ["/admin/catalog/inventory", "/admin"] },
);

export const loadMovements = adminAction(z.object({ variantId: z.string().min(1) }), async ({ variantId }) => listMovements(variantId));
