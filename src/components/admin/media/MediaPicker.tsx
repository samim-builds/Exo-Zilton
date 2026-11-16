"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { MediaFolder, MediaItem } from "@/lib/media-types";
import { MediaLibrary } from "./MediaLibrary";

type MediaPickerProps = {
  trigger: React.ReactNode;
  multiple?: boolean;
  defaultFolder?: MediaFolder;
  onPick: (items: MediaItem[]) => void;
};

export function MediaPicker({ trigger, multiple = false, defaultFolder, onPick }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [items, setItems] = useState<MediaItem[]>([]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelected([]);
      setItems([]);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Media library</DialogTitle>
          <DialogDescription>
            {multiple ? "Select one or more images, or upload new ones." : "Select an image, or upload a new one."}
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-6 min-h-0 flex-1 overflow-y-auto px-6">
          {open && (
            <MediaLibrary
              mode="pick"
              multiple={multiple}
              selected={selected}
              defaultFolder={defaultFolder}
              onSelectedChange={(urls, picked) => {
                setSelected(urls);
                setItems(picked);
              }}
            />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={items.length === 0}
            onClick={() => {
              onPick(items);
              handleOpenChange(false);
            }}
          >
            {multiple && items.length > 1 ? `Insert ${items.length} images` : "Insert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
