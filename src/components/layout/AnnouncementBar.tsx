"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { X } from "lucide-react";
import type { SiteSettings } from "@/lib/cms/settings";

const STORAGE_KEY = "exo_zilton_announcement_dismissed";
// Server render (and the first client pass) don't know yet; the bar stays
// hidden until we do, so a dismissed bar never flashes.
const UNKNOWN = "(unknown)";

function readDismissed(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function AnnouncementBar({ announcement }: { announcement: SiteSettings["announcement"] }) {
  const dismissed = useSyncExternalStore(subscribe, readDismissed, () => UNKNOWN);
  const [closed, setClosed] = useState(false);
  // A new message shows again even if an older one was dismissed.
  const visible = !closed && dismissed !== UNKNOWN && dismissed !== announcement.text;

  if (!announcement.enabled || !announcement.text || !visible) return null;

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, announcement.text);
    } catch {}
    setClosed(true);
  }

  return (
    <div className="relative bg-ink px-12 py-2.5 text-center text-sm text-porcelain">
      {announcement.text}
      {announcement.href && (
        <Link href={announcement.href} className="ml-2 underline decoration-porcelain/40 underline-offset-4 hover:decoration-porcelain">
          {announcement.linkLabel || "Learn more"}
        </Link>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss announcement"
        className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-porcelain/70 hover:text-porcelain"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
