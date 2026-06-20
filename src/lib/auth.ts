import type { SessionOptions } from "iron-session";

export type AdminSession = {
  isAdmin?: boolean;
};

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET ?? "complex_password_at_least_32_characters_long_exo_zilton",
  cookieName: "exo_zilton_admin",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};

export function getAdminPasswordHash(): string | undefined {
  return process.env.ADMIN_PASSWORD_HASH;
}

export function getAdminPasswordPlain(): string | undefined {
  return process.env.ADMIN_PASSWORD;
}
