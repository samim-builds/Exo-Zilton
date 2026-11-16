"use server";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { adminAction, AdminActionError } from "@/lib/admin/action";
import { logActivity } from "@/lib/admin/activity";
import { countMediaUsage, MEDIA_FOLDERS, removeStoredFile } from "@/lib/media";

const PAGE_SIZE = 40;

const select = {
  id: true,
  url: true,
  alt: true,
  mime: true,
  size: true,
  width: true,
  height: true,
  folder: true,
  createdAt: true,
} satisfies Prisma.MediaAssetSelect;

export const listMedia = adminAction(
  z.object({
    q: z.string().max(200).default(""),
    folder: z.enum(MEDIA_FOLDERS).optional(),
    cursor: z.string().optional(),
  }),
  async ({ q, folder, cursor }) => {
    const items = await prisma.mediaAsset.findMany({
      where: {
        ...(folder && { folder }),
        ...(q && {
          OR: [
            { alt: { contains: q, mode: "insensitive" } },
            { pathname: { contains: q, mode: "insensitive" } },
          ],
        }),
      },
      select,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: PAGE_SIZE + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = items.length > PAGE_SIZE;
    const page = hasMore ? items.slice(0, PAGE_SIZE) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  },
);

export const updateMedia = adminAction(
  z.object({
    id: z.string().min(1),
    alt: z.string().trim().max(300),
    folder: z.enum(MEDIA_FOLDERS),
  }),
  async ({ id, alt, folder }) => {
    const asset = await prisma.mediaAsset.update({ where: { id }, data: { alt, folder }, select });
    // Keep alt text on product images that use this file in sync.
    if (alt) await prisma.productImage.updateMany({ where: { url: asset.url }, data: { alt } });
    await logActivity({ entityType: "media", entityId: id, action: "UPDATE", summary: `Updated media details` });
    return asset;
  },
  { tags: ["products"] },
);

export const getMediaUsage = adminAction(z.object({ id: z.string().min(1) }), async ({ id }) => {
  const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { url: true } });
  return asset ? countMediaUsage(asset.url) : 0;
});

export const deleteMedia = adminAction(
  z.object({ id: z.string().min(1) }),
  async ({ id }) => {
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) throw new AdminActionError("This file was already deleted.");

    const usage = await countMediaUsage(asset.url);
    if (usage > 0) {
      throw new AdminActionError(`This image is used in ${usage} place(s). Remove it there first.`);
    }

    await removeStoredFile(asset);
    await prisma.mediaAsset.delete({ where: { id } });
    await logActivity({
      entityType: "media",
      entityId: id,
      action: "DELETE",
      summary: `Deleted ${asset.pathname}`,
    });
    return { id };
  },
);
