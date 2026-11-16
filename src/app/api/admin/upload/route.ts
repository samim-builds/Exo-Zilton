import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MEDIA_FOLDERS, storeFile, type MediaFolder } from "@/lib/media";
import { requireAdmin } from "@/lib/session";

// Vercel Functions accept request bodies up to 4.5 MB; the admin client
// downscales images before uploading so they fit.
const MAX_BYTES = 4.5 * 1024 * 1024;

function toInt(value: FormDataEntryValue | null): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is larger than 4.5 MB" }, { status: 413 });
  }

  const folderInput = String(formData.get("folder") ?? "general");
  const folder: MediaFolder = (MEDIA_FOLDERS as readonly string[]).includes(folderInput)
    ? (folderInput as MediaFolder)
    : "general";

  const { url, pathname } = await storeFile(file, folder);

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ url });
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      url,
      pathname,
      alt: String(formData.get("alt") ?? "").slice(0, 300),
      mime: file.type,
      size: file.size,
      width: toInt(formData.get("width")),
      height: toInt(formData.get("height")),
      folder,
    },
  });

  return NextResponse.json({ url, asset });
}
