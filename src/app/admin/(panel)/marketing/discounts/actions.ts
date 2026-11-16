"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { isUniqueViolation } from "@/lib/catalog/mutations";
import { discountInputSchema } from "@/lib/commerce/schemas";

const paths = { paths: ["/admin/marketing/discounts"] };

export const saveDiscount = adminAction(
  discountInputSchema,
  async ({ id, ...data }) => {
    try {
      const discount = id
        ? await prisma.discount.update({ where: { id }, data })
        : await prisma.discount.create({ data });
      await logActivity({
        entityType: "discount",
        entityId: discount.id,
        action: id ? "UPDATE" : "CREATE",
        summary: `${id ? "Updated" : "Created"} discount ${discount.code}`,
        diff: { type: data.type, active: data.active },
      });
      return { id: discount.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new AdminActionError(`The code ${data.code} is already in use.`);
      throw error;
    }
  },
  paths,
);

const ids = z.object({ ids: z.array(z.string().min(1)).min(1).max(500) });

export const setDiscountsActive = adminAction(
  ids.extend({ active: z.boolean() }),
  async ({ ids, active }) => {
    const { count } = await prisma.discount.updateMany({ where: { id: { in: ids } }, data: { active } });
    await logActivity({
      entityType: "discount",
      entityId: ids.join(","),
      action: "STATUS",
      summary: `${active ? "Activated" : "Deactivated"} ${count} discount(s)`,
    });
    return { count };
  },
  paths,
);

export const deleteDiscounts = adminAction(
  ids,
  async ({ ids }) => {
    // Codes that were redeemed stay for the order history; deactivate those instead.
    const used = await prisma.discount.count({ where: { id: { in: ids }, redemptions: { some: {} } } });
    if (used > 0) throw new AdminActionError(`${used} of these codes have been used on orders. Deactivate them instead.`);
    const { count } = await prisma.discount.deleteMany({ where: { id: { in: ids } } });
    await logActivity({ entityType: "discount", entityId: ids.join(","), action: "DELETE", summary: `Deleted ${count} discount(s)` });
    return { count };
  },
  paths,
);
