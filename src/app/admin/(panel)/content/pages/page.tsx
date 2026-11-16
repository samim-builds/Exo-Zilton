import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/admin/shell/PageHeader";
import { listPages, pagePath } from "@/lib/cms/admin-queries";
import { NewPageDialog } from "./NewPageDialog";

export const metadata = {
  title: "Pages | Admin",
  robots: { index: false, follow: false },
};

const STATUS = {
  PUBLISHED: { label: "Published", className: "border-green-200 bg-green-50 text-green-800" },
  DEFAULT: { label: "Live (original content)", className: "border-sky-200 bg-sky-50 text-sky-800" },
  DRAFT: { label: "Draft", className: "border-amber-200 bg-amber-50 text-amber-800" },
} as const;

export default async function AdminPagesPage() {
  const pages = await listPages();

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Edit the homepage and content pages section by section, or add new pages."
        actions={process.env.DATABASE_URL ? <NewPageDialog /> : undefined}
      />
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((p) => (
              <TableRow key={p.slug}>
                <TableCell>
                  <Link href={`/admin/content/pages/${p.slug}`} className="font-medium text-navy hover:underline">
                    {p.title}
                  </Link>
                  {p.isSystem && <span className="ml-2 text-xs text-muted-foreground">System</span>}
                </TableCell>
                <TableCell>
                  <a href={pagePath(p.slug)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
                    {pagePath(p.slug)}
                    <ExternalLink className="size-3" />
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className={STATUS[p.status].className}>
                      {STATUS[p.status].label}
                    </Badge>
                    {p.hasDraft && <Badge variant="outline">Unpublished changes</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {p.updatedAt ? new Date(p.updatedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
