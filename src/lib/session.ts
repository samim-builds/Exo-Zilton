import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { type AdminSession, getSessionOptions } from "./auth";

export async function getSession() {
  return getIronSession<AdminSession>(await cookies(), getSessionOptions());
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

export async function requireAdmin() {
  const ok = await isAdminAuthenticated();
  if (!ok) {
    throw new Error("Unauthorized");
  }
}
