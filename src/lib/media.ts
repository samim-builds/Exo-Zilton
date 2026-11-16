import { del, put } from "@vercel/blob";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { MediaAsset } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import type { MediaFolder } from "@/lib/media-types";

export { MEDIA_FOLDERS, type MediaFolder, type MediaItem } from "@/lib/media-types";

// @vercel/blob authenticates with either a read-write token or OIDC + store ID.
function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

const LOCAL_PREFIX = "/uploads/";

/** Stores the file (Vercel Blob, or public/uploads in local dev) and returns its URL and pathname. */
export async function storeFile(file: File, folder: MediaFolder): Promise<{ url: string; pathname: string }> {
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-").slice(-80)}`;

  if (blobConfigured()) {
    const blob = await put(`${folder}/${filename}`, file, { access: "public" });
    return { url: blob.url, pathname: blob.pathname };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), Buffer.from(await file.arrayBuffer()));
  return { url: `${LOCAL_PREFIX}${filename}`, pathname: filename };
}

export async function removeStoredFile(asset: Pick<MediaAsset, "url" | "pathname">): Promise<void> {
  if (asset.url.startsWith(LOCAL_PREFIX)) {
    await unlink(path.join(process.cwd(), "public", "uploads", path.basename(asset.pathname))).catch(() => {});
    return;
  }
  if (blobConfigured()) {
    await del(asset.url);
  }
}

/** Number of places an asset URL is referenced, so deletes can warn first. */
export async function countMediaUsage(url: string): Promise<number> {
  return prisma.productImage.count({ where: { url } });
}
