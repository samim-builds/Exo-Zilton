import Link from "next/link";
import { Download, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { listSubscribers } from "@/lib/cms/admin-queries";
import { parseTableParams, type SearchParams } from "@/lib/admin/table-params";
import { SubscribersTable } from "./SubscribersTable";

export const metadata = {
  title: "Subscribers | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminSubscribersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = parseTableParams(await searchParams, {
    sortable: ["createdAt"] as const,
    defaultSort: { id: "createdAt", desc: true },
  });
  const { rows, total } = process.env.DATABASE_URL
    ? await listSubscribers({ skip: params.skip, take: params.take, q: params.q || undefined })
    : { rows: [], total: 0 };

  return (
    <div>
      <PageHeader
        title="Subscribers"
        description="People who joined through the welcome offer, with the one-time code each received."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/settings?tab=welcomeOffer">
                <Settings2 />
                Welcome offer
              </Link>
            </Button>
            <Button variant="outline" asChild>
              {/* A file download from a route handler, so a plain link. */}
              <a href="/api/admin/subscribers/export" download>
                <Download />
                Export CSV
              </a>
            </Button>
          </>
        }
      />
      <SubscribersTable rows={rows} total={total} />
    </div>
  );
}
