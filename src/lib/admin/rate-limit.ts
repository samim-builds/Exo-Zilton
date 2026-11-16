import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

// Failed attempts per key (e.g. an IP) are counted in the database so the
// limit holds across serverless instances. Without a database, or if the
// lookup fails, the limit is skipped rather than locking people out.
export async function isRateLimited(key: string, maxFailures = MAX_FAILURES): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  try {
    const failures = await prisma.loginAttempt.count({
      where: { ip: key, success: false, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
    });
    return failures >= maxFailures;
  } catch (error) {
    console.error("Rate limit check failed", error);
    return false;
  }
}

export async function recordAttempt(key: string, success: boolean): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    if (success) {
      // A success clears the failure count for this key.
      await prisma.loginAttempt.deleteMany({ where: { ip: key, success: false } });
    } else {
      await prisma.loginAttempt.create({ data: { ip: key, success } });
    }
  } catch (error) {
    console.error("Failed to record attempt", error);
  }
}

export const isLoginLocked = (ip: string) => isRateLimited(ip);
export const recordLoginAttempt = (ip: string, success: boolean) => recordAttempt(ip, success);
