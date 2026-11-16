import Link from "next/link";
import type { SiteSettings } from "@/lib/cms/settings";

export function AnnouncementBar({ announcement }: { announcement: SiteSettings["announcement"] }) {
  if (!announcement.enabled || !announcement.text) return null;
  return (
    <div className="bg-navy px-4 py-2 text-center text-xs tracking-wide text-white sm:text-sm">
      {announcement.text}
      {announcement.href && (
        <Link href={announcement.href} className="ml-2 font-medium text-gold underline-offset-4 hover:underline">
          {announcement.linkLabel || "Learn more"}
        </Link>
      )}
    </div>
  );
}
