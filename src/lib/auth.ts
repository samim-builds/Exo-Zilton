import { timingSafeEqual } from "crypto";
import type { SessionOptions } from "iron-session";

export type AdminSession = {
  isAdmin?: boolean;
};

const DEV_SESSION_SECRET = "complex_password_at_least_32_characters_long_exo_zilton";

// Resolved lazily so `next build` doesn't need the secret, but a production
// server refuses to sign sessions with the public development fallback.
export function getSessionOptions(): SessionOptions {
  const secret = process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  return {
    password: secret ?? DEV_SESSION_SECRET,
    cookieName: "exo_zilton_admin",
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
    },
  };
}

export function getAdminPasswordHash(): string | undefined {
  return process.env.ADMIN_PASSWORD_HASH;
}

export function getAdminPasswordPlain(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
