import { headers } from "next/headers";
import type { ActivityAction, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type ActivityEntry = {
  entityType: string;
  entityId: string;
  action: ActivityAction;
  summary: string;
  diff?: Record<string, unknown>;
};

export async function logActivity(entry: ActivityEntry): Promise<void> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");

  try {
    await prisma.activityLog.create({
      data: {
        ...entry,
        diff: entry.diff as Prisma.InputJsonValue | undefined,
        ip,
        userAgent: h.get("user-agent")?.slice(0, 300),
      },
    });
  } catch (error) {
    // The audit trail must never block the change it describes.
    console.error("Failed to write activity log", error);
  }
}

// Shallow before/after diff of the fields that changed, for the activity log.
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = { from: before[key] ?? null, to: after[key] ?? null };
    }
  }
  return changes;
}
