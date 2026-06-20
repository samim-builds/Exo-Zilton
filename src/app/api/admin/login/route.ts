import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/admin-schemas";
import { getAdminPasswordHash, getAdminPasswordPlain } from "@/lib/auth";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = loginSchema.parse(body);

    const hash = getAdminPasswordHash();
    const plain = getAdminPasswordPlain();

    let valid = false;
    if (hash) {
      valid = await bcrypt.compare(password, hash);
    } else if (plain) {
      valid = password === plain;
    } else {
      return NextResponse.json(
        { error: "Admin password not configured. Set ADMIN_PASSWORD in environment." },
        { status: 500 },
      );
    }

    if (!valid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const session = await getSession();
    session.isAdmin = true;
    await session.save();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
