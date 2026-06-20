import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata = {
  title: "Admin Login | Exo Zilton",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream/40 px-4">
      <AdminLoginForm />
    </div>
  );
}
