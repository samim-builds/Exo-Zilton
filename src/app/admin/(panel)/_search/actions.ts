"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { adminAction } from "@/lib/admin/action";
import { parseSearch } from "@/lib/admin/search";
import { productEditHref } from "@/components/admin/shell/nav-config";

export type SearchHit = { id: string; label: string; detail: string; href: string };
export type SearchResults = { products: SearchHit[]; orders: SearchHit[]; pages: SearchHit[] };

const TAKE = 5;

/** Products, bundles, orders and pages matching the command palette query. */
export const searchAdmin = adminAction(z.object({ q: z.string().max(200) }), async ({ q }): Promise<SearchResults> => {
  const { text, orderNumber } = parseSearch(q);
  if (!text) return { products: [], orders: [], pages: [] };
  const contains = { contains: text, mode: "insensitive" as const };

  const [products, orders, pages] = await Promise.all([
    prisma.product.findMany({
      where: { status: { not: "ARCHIVED" }, OR: [{ name: contains }, { slug: contains }, { variants: { some: { sku: contains } } }] },
      select: { id: true, name: true, kind: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: TAKE,
    }),
    prisma.order.findMany({
      where: { OR: [...(orderNumber !== null ? [{ number: orderNumber }] : []), { name: contains }, { email: contains }, { phone: contains }] },
      select: { id: true, number: true, name: true, status: true },
      orderBy: { createdAt: "desc" },
      take: TAKE,
    }),
    prisma.page.findMany({
      where: { OR: [{ title: contains }, { slug: contains }] },
      select: { slug: true, title: true },
      take: TAKE,
    }),
  ]);

  const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
  return {
    products: products.map((p) => ({
      id: p.id,
      label: p.name,
      detail: `${p.kind === "BUNDLE" ? "Bundle" : "Product"} · ${titleCase(p.status)}`,
      href: productEditHref(p.id, p.kind),
    })),
    orders: orders.map((o) => ({ id: o.id, label: `Order #${o.number}`, detail: `${o.name} · ${titleCase(o.status)}`, href: `/admin/orders/${o.id}` })),
    pages: pages.map((p) => ({ id: p.slug, label: p.title, detail: `/${p.slug === "home" ? "" : p.slug}`, href: `/admin/content/pages/${p.slug}` })),
  };
});
