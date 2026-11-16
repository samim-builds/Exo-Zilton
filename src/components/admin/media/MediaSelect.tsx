"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, ImageIcon, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listMedia } from "@/app/admin/(panel)/media/actions";
import type { MediaFolder, MediaItem } from "@/lib/media-types";
import { cn } from "@/lib/utils";
import { MediaPicker } from "./MediaPicker";

// A dropdown of media-library images with thumbnails. The current value is
// shown even when it isn't in the library (e.g. a built-in /hero/… image).

function fileName(url: string): string {
  const last = url.split("?")[0].split("/").pop() ?? url;
  // Uploads are stored as "<timestamp>-<name>".
  return decodeURIComponent(last).replace(/^\d{10,}-/, "");
}

function Thumb({ url, className }: { url: string; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded border bg-muted", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of an arbitrary URL
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <ImageIcon className="size-4 text-muted-foreground" />
      )}
    </span>
  );
}

export function MediaSelect({ value, onChange, folder }: { value: string; onChange: (url: string) => void; folder?: MediaFolder }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState("");
  const [pasted, setPasted] = useState("");

  useEffect(() => {
    if (!open) return;
    let live = true;
    const timer = window.setTimeout(() => {
      void listMedia({ q }).then((res) => {
        if (!live) return;
        if (res.ok) {
          setItems(res.data.items);
          setError("");
        } else {
          setError(res.error);
        }
      });
    }, 200);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [open, q]);

  function choose(url: string) {
    onChange(url);
    setOpen(false);
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} className="h-auto min-w-0 flex-1 justify-start gap-3 px-2 py-1.5">
            <Thumb url={value} className="size-10" />
            <span className="min-w-0 flex-1 truncate text-left font-normal">
              {value ? fileName(value) : <span className="text-muted-foreground">Select an image…</span>}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(26rem,calc(100vw-2rem))] p-0">
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search the media library…"
              className="h-10 border-0 px-0 shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="max-h-80 overflow-y-auto p-1" role="listbox" aria-label="Media library images">
            {items === null && !error ? (
              <Loader2 className="mx-auto my-6 size-5 animate-spin text-muted-foreground" />
            ) : error ? (
              <p className="p-4 text-sm text-destructive">{error}</p>
            ) : items!.filter((i) => i.mime.startsWith("image/")).length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{q ? "No images match." : "The media library is empty. Upload images with Browse."}</p>
            ) : (
              items!
                .filter((i) => i.mime.startsWith("image/"))
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={item.url === value}
                    onClick={() => choose(item.url)}
                    className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <Thumb url={item.url} className="size-12" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{item.alt || fileName(item.url)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.folder}
                        {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                      </span>
                    </span>
                    {item.url === value && <Check className="size-4 shrink-0" />}
                  </button>
                ))
            )}
          </div>
          <form
            className="flex gap-2 border-t p-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (pasted.trim()) choose(pasted.trim());
            }}
          >
            <Input value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="Or paste an image URL or /path" className="h-8" />
            <Button type="submit" size="sm" variant="secondary" disabled={!pasted.trim()}>
              Use
            </Button>
          </form>
        </PopoverContent>
      </Popover>
      <MediaPicker
        defaultFolder={folder}
        trigger={
          <Button type="button" variant="outline" size="sm">
            Browse
          </Button>
        }
        onPick={(picked) => picked[0] && onChange(picked[0].url)}
      />
      {value && (
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear image" onClick={() => onChange("")}>
          <X />
        </Button>
      )}
    </div>
  );
}
