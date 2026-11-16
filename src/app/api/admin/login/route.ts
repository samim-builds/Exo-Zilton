import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/admin-schemas";
import { getAdminPasswordHash, getAdminPasswordPlain, safeEqual } from "@/lib/auth";
import { getClientIp, isLoginLocked, recordLoginAttempt } from "@/lib/admin/rate-limit";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { password } = parsed.data;

  const hash = getAdminPasswordHash();
  const plain = getAdminPasswordPlain();
  if (!hash && !plain) {
    return NextResponse.json(
      { error: "Admin password not configured. Set ADMIN_PASSWORD_HASH in environment." },
      { status: 500 },
    );
  }

  const ip = getClientIp(request);
  if (await isLoginLocked(ip)) {
    return NextResponse.json(
      { error: "Too many failed attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  const valid = hash ? await bcrypt.compare(password, hash) : safeEqual(password, plain!);
  await recordLoginAttempt(ip, valid);

  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  return NextResponse.json({ success: true });
}
