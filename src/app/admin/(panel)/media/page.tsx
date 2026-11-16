import { PageHeader } from "@/components/admin/shell/PageHeader";
import { MediaManager } from "./MediaManager";

export const metadata = {
  title: "Media library | Admin",
  robots: { index: false, follow: false },
};

export default function AdminMediaPage() {
  return (
    <div>
      <PageHeader
        title="Media library"
        description="Every image used across products and pages. Large photos are resized to 2560px WebP on upload."
      />
      <MediaManager />
    </div>
  );
}
