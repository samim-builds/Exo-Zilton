"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatBytes, MediaLibrary, MediaThumb } from "@/components/admin/media/MediaLibrary";
import { MEDIA_FOLDER_LABELS, MEDIA_FOLDERS, type MediaFolder, type MediaItem } from "@/lib/media-types";
import { deleteMedia, getMediaUsage, updateMedia } from "./actions";

export function MediaManager() {
  const [active, setActive] = useState<MediaItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <MediaLibrary mode="manage" onOpenItem={setActive} refreshKey={refreshKey} />
      <Sheet open={active !== null} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {active && (
            <MediaDetails
              key={active.id}
              item={active}
              onChanged={() => setRefreshKey((k) => k + 1)}
              onDeleted={() => {
                setActive(null);
                setRefreshKey((k) => k + 1);
              }}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MediaDetails({
  item,
  onChanged,
  onDeleted,
}: {
  item: MediaItem;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [alt, setAlt] = useState(item.alt);
  const [folder, setFolder] = useState<MediaFolder>(item.folder as MediaFolder);
  const [usage, setUsage] = useState<number | null>(null);
  const [saving, startSaving] = useTransition();
  const [deleting, startDeleting] = useTransition();

  useEffect(() => {
    getMediaUsage({ id: item.id }).then((res) => res.ok && setUsage(res.data));
  }, [item.id]);

  const absoluteUrl = item.url.startsWith("/") ? `${window.location.origin}${item.url}` : item.url;
  const dirty = alt !== item.alt || folder !== item.folder;

  function save() {
    startSaving(async () => {
      const res = await updateMedia({ id: item.id, alt, folder });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Saved");
      onChanged();
    });
  }

  function remove() {
    startDeleting(async () => {
      const res = await deleteMedia({ id: item.id });
      if (!res.ok) return void toast.error(res.error);
      toast.success("Image deleted");
      onDeleted();
    });
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle>Image details</SheetTitle>
        <SheetDescription>
          Uploaded {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-4">
        <MediaThumb item={item} className="aspect-auto h-64 bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px] [&_img]:object-contain" />
        <dl className="grid grid-cols-3 gap-2 text-sm">
          <dt className="text-muted-foreground">Type</dt>
          <dd className="col-span-2">{item.mime}</dd>
          <dt className="text-muted-foreground">Size</dt>
          <dd className="col-span-2">
            {formatBytes(item.size)}
            {item.width && item.height ? ` · ${item.width}×${item.height}px` : ""}
          </dd>
          <dt className="text-muted-foreground">Used in</dt>
          <dd className="col-span-2">{usage === null ? "…" : usage === 0 ? "Not used" : `${usage} place(s)`}</dd>
        </dl>
        <div className="space-y-2">
          <Label htmlFor="media-alt">Alt text</Label>
          <Input
            id="media-alt"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the image for screen readers and SEO"
          />
          <p className="text-xs text-muted-foreground">Also updates product images that use this file.</p>
        </div>
        <div className="space-y-2">
          <Label>Folder</Label>
          <Select value={folder} onValueChange={(v) => setFolder(v as MediaFolder)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEDIA_FOLDERS.map((f) => (
                <SelectItem key={f} value={f}>
                  {MEDIA_FOLDER_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="media-url">URL</Label>
          <div className="flex gap-2">
            <Input id="media-url" value={absoluteUrl} readOnly className="font-mono text-xs" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy URL"
              onClick={() => navigator.clipboard.writeText(absoluteUrl).then(() => toast.success("URL copied"))}
            >
              <Copy />
            </Button>
          </div>
        </div>
      </div>
      <SheetFooter className="flex-row justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:text-destructive" disabled={deleting || (usage ?? 0) > 0}>
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this image?</AlertDialogTitle>
              <AlertDialogDescription>The file is removed from storage. This cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving && <Loader2 className="animate-spin" />}
          Save
        </Button>
      </SheetFooter>
    </>
  );
}
