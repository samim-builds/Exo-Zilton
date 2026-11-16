import { notFound } from "next/navigation";
import { getPageForEdit, pagePath } from "@/lib/cms/admin-queries";
import { PageEditor } from "./PageEditor";

export const metadata = {
  title: "Edit page | Admin",
  robots: { index: false, follow: false },
};

export default async function AdminEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getPageForEdit(slug);
  if (!page) notFound();
  return <PageEditor page={page} path={pagePath(slug)} />;
}
