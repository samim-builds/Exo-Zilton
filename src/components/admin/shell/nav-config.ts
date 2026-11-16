import {
  ClipboardList,
  FolderTree,
  History,
  Images,
  LayoutDashboard,
  Package,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const adminNav: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/catalog/products", label: "Products", icon: Package },
      { href: "/admin/catalog/categories", label: "Categories", icon: FolderTree },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/media", label: "Media library", icon: Images }],
  },
  {
    label: "System",
    items: [{ href: "/admin/activity", label: "Activity log", icon: History }],
  },
];

// Breadcrumb labels for static path segments; dynamic ids fall back to "Details".
export const segmentLabels: Record<string, string> = {
  admin: "Dashboard",
  orders: "Orders",
  catalog: "Catalog",
  categories: "Categories",
  products: "Products",
  media: "Media library",
  activity: "Activity log",
  new: "New",
  edit: "Edit",
};

export function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}
