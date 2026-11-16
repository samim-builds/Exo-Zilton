"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { segmentLabels } from "./nav-config";
import { CommandPalette } from "./CommandPalette";

function useBreadcrumbs() {
  const segments = usePathname().split("/").filter(Boolean);
  return segments.map((segment, i) => ({
    href: `/${segments.slice(0, i + 1).join("/")}`,
    label: segmentLabels[segment] ?? "Details",
  }));
}

export function AdminTopbar() {
  const router = useRouter();
  const crumbs = useBreadcrumbs();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <Fragment key={crumb.href}>
              {i > 0 && <BreadcrumbSeparator className="hidden sm:block" />}
              <BreadcrumbItem className={i < crumbs.length - 1 ? "hidden sm:inline-flex" : undefined}>
                {i === crumbs.length - 1 ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <CommandPalette />
      <Button variant="ghost" size="sm" asChild>
        <Link href="/" target="_blank">
          <ExternalLink />
          <span className="hidden sm:inline">View site</span>
        </Link>
      </Button>
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut />
        <span className="hidden sm:inline">Log out</span>
      </Button>
    </header>
  );
}
