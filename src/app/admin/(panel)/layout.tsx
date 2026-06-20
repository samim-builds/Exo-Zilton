import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream/40">
      <AdminNav />
      <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
    </div>
  );
}
