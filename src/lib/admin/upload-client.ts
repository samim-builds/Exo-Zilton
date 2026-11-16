"use client";

import type { MediaItem } from "@/lib/media-types";

const MAX_DIMENSION = 2560;
const MAX_BYTES = 4 * 1024 * 1024;

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Downscale oversized photos to WebP in the browser so uploads stay under the
// function body limit and storefront images stay light. SVGs/GIFs pass through.
async function prepareImage(file: File): Promise<{ file: File; width?: number; height?: number }> {
  if (file.type === "image/svg+xml" || file.type === "image/gif") return { file };

  const img = await loadImage(file);
  const { naturalWidth: width, naturalHeight: height } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  if (scale === 1 && file.size <= MAX_BYTES) return { file, width, height };

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.86));
  if (!blob) return { file, width, height };

  const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
  return { file: new File([blob], name, { type: "image/webp" }), width: canvas.width, height: canvas.height };
}

export async function uploadImage(
  original: File,
  options: { folder?: string; alt?: string } = {},
): Promise<{ url: string; asset?: MediaItem }> {
  const { file, width, height } = await prepareImage(original);

  const body = new FormData();
  body.append("file", file);
  body.append("folder", options.folder ?? "general");
  if (options.alt) body.append("alt", options.alt);
  if (width) body.append("width", String(width));
  if (height) body.append("height", String(height));

  const res = await fetch("/api/admin/upload", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data;
}
