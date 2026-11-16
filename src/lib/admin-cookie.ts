import { unsealData } from "iron-session";
import type { SessionOptions } from "iron-session";
import type { AdminSession } from "./auth";

/**
 * True only when the cookie decrypts with the session secret and carries the
 * admin flag. Used by the proxy so every admin request, including client-side
 * navigations that skip the panel layout, is checked against the real session.
 */
export async function hasValidAdminCookie(value: string | undefined, password: SessionOptions["password"]): Promise<boolean> {
  if (!value) return false;
  try {
    const session = await unsealData<AdminSession>(value, { password });
    return session.isAdmin === true;
  } catch {
    return false;
  }
}
