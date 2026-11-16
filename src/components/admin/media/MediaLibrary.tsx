"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Check, ImagePlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMedia } from "@/app/admin/(panel)/media/actions";
import { uploadImage } from "@/lib/admin/upload-client";
import { MEDIA_FOLDER_LABELS, MEDIA_FOLDERS, type MediaFolder, type MediaItem } from "@/lib/media-types";
import { cn } from "@/lib/utils";

type Folder = MediaFolder;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaThumb({ item, className }: { item: Pick<MediaItem, "url" | "alt">; className?: string }) {
  return (
    <div className={cn("relative aspect-square overflow-hidden rounded-md bg-muted", className)}>
      <Image
        src={item.url}
        alt={item.alt}
        fill
        sizes="200px"
        className="object-cover"
        unoptimized={item.url.endsWith(".svg")}
      />
    </div>
  );
}

type MediaLibraryProps = {
  /** "manage" opens details on click; "pick" toggles selection. */
  mode: "manage" | "pick";
  multiple?: boolean;
  selected?: string[];
  onSelectedChange?: (urls: string[], items: MediaItem[]) => void;
  onOpenItem?: (item: MediaItem) => void;
  defaultFolder?: Folder;
  /** Bump to force a reload (e.g. after an item is edited or deleted). */
  refreshKey?: number;
};

export function MediaLibrary({
  mode,
  multiple = false,
  selected = [],
  onSelectedChange,
  onOpenItem,
  defaultFolder,
  refreshKey = 0,
}: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [folder, setFolder] = useState<Folder | "all">(defaultFolder ?? "all");
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isLoading, startLoading] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const pickedItems = useRef(new Map<string, MediaItem>());

  const load = useCallback(
    (cursor?: string) => {
      startLoading(async () => {
        const res = await listMedia({ q, folder: folder === "all" ? undefined : folder, cursor });
        if (!res.ok) {
          toast.error(res.error);
          return;
        }
        setItems((prev) => (cursor ? [...prev, ...res.data.items] : res.data.items));
        setNextCursor(res.data.nextCursor);
      });
    },
    [q, folder],
  );

  useEffect(() => {
    const id = setTimeout(() => load(), q ? 300 : 0);
    return () => clearTimeout(id);
  }, [load, q, refreshKey]);

  async function handleFiles(files: FileList | File[]) {
    const images = [...files].filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    setUploading((n) => n + images.length);
    const target = folder === "all" ? (defaultFolder ?? "general") : folder;
    const uploaded: MediaItem[] = [];

    await Promise.all(
      images.map(async (file) => {
        try {
          const { asset } = await uploadImage(file, { folder: target });
          if (asset) uploaded.push(asset);
        } catch (error) {
          toast.error(`${file.name}: ${error instanceof Error ? error.message : "Upload failed"}`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );

    if (uploaded.length > 0) {
      toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? "s" : ""}`);
      setItems((prev) => [...uploaded, ...prev]);
      // In pick mode, newly uploaded images are selected straight away.
      if (mode === "pick") {
        uploaded.forEach((a) => pickedItems.current.set(a.url, a));
        const urls = multiple ? [...selected, ...uploaded.map((a) => a.url)] : [uploaded[0].url];
        onSelectedChange?.(urls, urls.map((u) => pickedItems.current.get(u)!).filter(Boolean));
      }
    }
  }

  function handleClick(item: MediaItem) {
    if (mode === "manage") {
      onOpenItem?.(item);
      return;
    }
    pickedItems.current.set(item.url, item);
    const isSelected = selected.includes(item.url);
    const urls = multiple
      ? isSelected
        ? selected.filter((u) => u !== item.url)
        : [...selected, item.url]
      : isSelected
        ? []
        : [item.url];
    onSelectedChange?.(urls, urls.map((u) => pickedItems.current.get(u)!).filter(Boolean));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by alt text or name…"
            className="h-8 bg-background pl-8"
            aria-label="Search media"
          />
        </div>
        <Select value={folder} onValueChange={(v) => setFolder(v as Folder | "all")}>
          <SelectTrigger size="sm" className="w-36 bg-background" aria-label="Folder">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All folders</SelectItem>
            {MEDIA_FOLDERS.map((f) => (
              <SelectItem key={f} value={f}>
                {MEDIA_FOLDER_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" className="ml-auto" onClick={() => fileInput.current?.click()} disabled={uploading > 0}>
          {uploading > 0 ? <Loader2 className="animate-spin" /> : <ImagePlus />}
          {uploading > 0 ? `Uploading ${uploading}…` : "Upload"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "min-h-48 rounded-lg border-2 border-dashed border-transparent p-1 transition-colors",
          dragging && "border-primary/40 bg-primary/5",
        )}
      >
        {items.length === 0 && !isLoading ? (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex h-48 w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-background text-sm text-muted-foreground hover:bg-muted/50"
          >
            <ImagePlus className="size-6" />
            {q ? "No images match your search." : "Drop images here or click to upload"}
          </button>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {items.map((item) => {
              const isSelected = selected.includes(item.url);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(item)}
                    aria-pressed={mode === "pick" ? isSelected : undefined}
                    className={cn(
                      "group relative block w-full rounded-lg border bg-background p-1.5 text-left transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected && "border-primary ring-2 ring-primary/30",
                    )}
                  >
                    <MediaThumb item={item} />
                    {isSelected && (
                      <span className="absolute top-2.5 right-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                    <p className="mt-1.5 truncate text-xs">{item.alt || <span className="text-amber-700">No alt text</span>}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.width && item.height ? `${item.width}×${item.height} · ` : ""}
                      {formatBytes(item.size)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {(nextCursor || isLoading) && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => nextCursor && load(nextCursor)} disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            {isLoading ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
