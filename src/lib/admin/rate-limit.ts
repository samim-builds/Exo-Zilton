import { prisma } from "@/lib/db";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

// Failed logins per IP are counted in the database so the limit holds across
// serverless instances. Without a database, or if the lookup fails, the limit
// is skipped rather than locking the admin out; the password check still applies.
export async function isLoginLocked(ip: string): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;

  try {
    const failures = await prisma.loginAttempt.count({
      where: { ip, success: false, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } },
    });
    return failures >= MAX_FAILURES;
  } catch (error) {
    console.error("Login rate limit check failed", error);
    return false;
  }
}

export async function recordLoginAttempt(ip: string, success: boolean): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    if (success) {
      // A successful login clears the failure count for this IP.
      await prisma.loginAttempt.deleteMany({ where: { ip, success: false } });
    } else {
      await prisma.loginAttempt.create({ data: { ip, success } });
    }
  } catch (error) {
    console.error("Failed to record login attempt", error);
  }
}
