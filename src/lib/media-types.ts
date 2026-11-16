import type { MediaAsset } from "@/generated/prisma/client";

// Client-safe media constants and types (src/lib/media.ts is server-only).

export const MEDIA_FOLDERS = ["general", "products", "categories", "pages", "brand"] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const MEDIA_FOLDER_LABELS: Record<MediaFolder, string> = {
  general: "General",
  products: "Products",
  categories: "Categories",
  pages: "Pages",
  brand: "Brand",
};

export type MediaItem = Pick<
  MediaAsset,
  "id" | "url" | "alt" | "mime" | "size" | "width" | "height" | "folder" | "createdAt"
>;
