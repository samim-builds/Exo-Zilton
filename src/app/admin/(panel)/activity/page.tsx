import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { ACTIVITY_ACTIONS } from "@/lib/admin/activity-types";
import { ActivityTable } from "./ActivityTable";

export const metadata = {
  title: "Activity log | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: ["createdAt"] as const,
    defaultSort: { id: "createdAt", desc: true },
    filters: ["entity", "action"] as const,
  });

  const where: Prisma.ActivityLogWhereInput = {
    ...(params.q && { summary: { contains: params.q, mode: "insensitive" } }),
    ...(params.filters.entity && { entityType: { in: params.filters.entity } }),
    ...(params.filters.action && {
      action: { in: params.filters.action.filter((a) => (ACTIVITY_ACTIONS as readonly string[]).includes(a)) as never },
    }),
  };

  const db = Boolean(process.env.DATABASE_URL);
  const [rows, total, entityTypes] = db
    ? await Promise.all([
        prisma.activityLog.findMany({
          where,
          orderBy: { createdAt: params.sort.desc ? "desc" : "asc" },
          skip: params.skip,
          take: params.take,
        }),
        prisma.activityLog.count({ where }),
        prisma.activityLog.findMany({ distinct: ["entityType"], select: { entityType: true } }),
      ])
    : [[], 0, []];

  return (
    <div>
      <PageHeader title="Activity log" description="Every change made in the admin panel." />
      <ActivityTable
        rows={rows.map((r) => ({
          id: r.id,
          entityType: r.entityType,
          entityId: r.entityId,
          action: r.action,
          summary: r.summary,
          diff: r.diff as Record<string, { from: unknown; to: unknown }> | null,
          ip: r.ip,
          createdAt: r.createdAt,
        }))}
        total={total}
        entityTypes={entityTypes.map((e) => e.entityType)}
      />
    </div>
  );
}
