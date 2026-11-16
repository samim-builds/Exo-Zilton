"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { saveProductGraph } from "@/lib/catalog/mutations";
import { productInputSchema } from "@/lib/catalog/schemas";
import { CATALOG_TAG } from "@/lib/products-server";

const site = { site: true, tags: [CATALOG_TAG], paths: ["/admin/catalog/products", "/admin/catalog/bundles"] };

export const saveProduct = adminAction(
  productInputSchema,
  async (data) => {
    const result = await saveProductGraph(data);
    await logActivity({
      entityType: "product",
      entityId: result.id,
      action: result.created ? "CREATE" : "UPDATE",
      summary: `${result.created ? "Created" : "Updated"} ${data.kind === "BUNDLE" ? "bundle" : "product"} "${data.name}"`,
      diff: { status: data.status, variants: data.variants.length },
    });
    return result;
  },
  site,
);

const ids = z.object({ ids: z.array(z.string().min(1)).min(1).max(200) });

export const setProductsStatus = adminAction(
  ids.extend({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]) }),
  async ({ ids, status }) => {
    const { count } = await prisma.product.updateMany({ where: { id: { in: ids } }, data: { status } });
    await logActivity({
      entityType: "product",
      entityId: ids.join(","),
      action: "STATUS",
      summary: `Set ${count} product(s) to ${status.toLowerCase()}`,
    });
    return { count };
  },
  site,
);

export const deleteProducts = adminAction(
  ids,
  async ({ ids }) => {
    const ordered = await prisma.product.count({
      where: { id: { in: ids }, OR: [{ orderItems: { some: {} } }, { variants: { some: { orderItems: { some: {} } } } }] },
    });
    if (ordered > 0) {
      throw new AdminActionError(
        `${ordered} of these product(s) appear on past orders. Archive them instead so order history stays intact.`,
      );
    }
    const bundled = await prisma.product.findMany({
      where: { id: { in: ids }, variants: { some: { inBundles: { some: { bundleProductId: { notIn: ids } } } } } },
      select: { name: true },
    });
    if (bundled.length > 0) {
      throw new AdminActionError(
        `${bundled.map((p) => `"${p.name}"`).join(", ")} is part of a bundle. Remove it from the bundle first, or archive it.`,
      );
    }
    const names = await prisma.product.findMany({ where: { id: { in: ids } }, select: { name: true } });
    const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await logActivity({
      entityType: "product",
      entityId: ids.join(","),
      action: "DELETE",
      summary: `Deleted ${names.map((n) => `"${n.name}"`).join(", ")}`,
    });
    return { count };
  },
  site,
);

export const duplicateProduct = adminAction(
  z.object({ id: z.string().min(1) }),
  async ({ id }) => {
    const { getProductForEdit } = await import("@/lib/catalog/admin-queries");
    const source = await getProductForEdit(id);
    if (!source) throw new AdminActionError("Product not found.");

    // Find a free "-copy" slug and suffix SKUs so the copy saves cleanly as a draft.
    let slug = `${source.slug}-copy`;
    for (let n = 2; await prisma.product.findUnique({ where: { slug }, select: { id: true } }); n++) {
      slug = `${source.slug}-copy-${n}`;
    }
    const suffix = slug.slice(source.slug.length).toUpperCase();

    const copy = productInputSchema.parse({
      ...source,
      id: undefined,
      name: `${source.name} (copy)`,
      slug,
      status: "DRAFT",
      // A copy is a new product with no stock of its own.
      variants: source.variants.map((v) => ({ ...v, id: undefined, sku: `${v.sku}${suffix}`, stockQty: 0 })),
    });
    const result = await saveProductGraph(copy);
    await logActivity({
      entityType: "product",
      entityId: result.id,
      action: "CREATE",
      summary: `Duplicated "${source.name}" as a draft`,
    });
    return result;
  },
  site,
);
