import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/session";
import { toCsv } from "@/lib/csv";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return new Response("Database not configured", { status: 503 });
  }

  const subscribers = await prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } });
  const discounts = await prisma.discount.findMany({
    where: { id: { in: subscribers.flatMap((s) => (s.welcomeDiscountId ? [s.welcomeDiscountId] : [])) } },
    select: { id: true, code: true, usedCount: true },
  });
  const byId = new Map(discounts.map((d) => [d.id, d]));

  const csv = toCsv([
    ["email", "joined", "source", "consent", "welcome_code", "code_used"],
    ...subscribers.map((s) => {
      const d = s.welcomeDiscountId ? byId.get(s.welcomeDiscountId) : undefined;
      return [s.email, s.createdAt.toISOString(), s.source, s.consent ? "yes" : "no", d?.code ?? "", d ? (d.usedCount > 0 ? "yes" : "no") : ""];
    }),
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
