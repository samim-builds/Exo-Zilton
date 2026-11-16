import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { isAdminAuthenticated } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // The proxy only checks that a cookie exists; verify the encrypted session here.
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  // The sidebar component persists its open/collapsed state in this cookie.
  const sidebarOpen = (await cookies()).get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      <AdminSidebar />
      <SidebarInset className="bg-muted/40">
        <AdminTopbar />
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
