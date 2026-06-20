"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="border-b border-charcoal/10 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-serif text-xl font-semibold text-navy">
            Exo Zilton Admin
          </Link>
          <nav className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm ${pathname === link.href ? "font-semibold text-navy" : "text-charcoal/70 hover:text-navy"}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-charcoal/70 hover:text-navy" target="_blank">
            View site
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-charcoal/20 px-3 py-1.5 text-sm hover:bg-cream"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
