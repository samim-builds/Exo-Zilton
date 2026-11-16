"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { getCategoryForEdit } from "@/lib/catalog/admin-queries";
import { saveCategoryGraph } from "@/lib/catalog/mutations";
import { categoryInputSchema } from "@/lib/catalog/schemas";
import { CATALOG_TAG } from "@/lib/products-server";

const site = { site: true, tags: [CATALOG_TAG], paths: ["/admin/catalog/categories"] };

export const loadCategory = adminAction(z.object({ id: z.string().min(1) }), async ({ id }) => {
  const category = await getCategoryForEdit(id);
  if (!category) throw new AdminActionError("Category not found.");
  return category;
});

export const saveCategory = adminAction(
  categoryInputSchema,
  async (data) => {
    const result = await saveCategoryGraph(data);
    await logActivity({
      entityType: "category",
      entityId: result.id,
      action: result.created ? "CREATE" : "UPDATE",
      summary: `${result.created ? "Created" : "Updated"} category "${data.name}"`,
      diff: { attributes: data.attributes.map((a) => a.key) },
    });
    return result;
  },
  site,
);

export const deleteCategory = adminAction(
  z.object({ id: z.string().min(1) }),
  async ({ id }) => {
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!category) throw new AdminActionError("Category not found.");
    if (category._count.products > 0 || category._count.children > 0) {
      throw new AdminActionError("Move its products and subcategories elsewhere before deleting this category.");
    }
    await prisma.category.delete({ where: { id } });
    await logActivity({ entityType: "category", entityId: id, action: "DELETE", summary: `Deleted category "${category.name}"` });
    return { id };
  },
  site,
);
