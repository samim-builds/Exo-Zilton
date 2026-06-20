import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`products/${filename}`, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
