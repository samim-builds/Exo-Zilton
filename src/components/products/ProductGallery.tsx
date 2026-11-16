"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

// Main image with a thumbnail rail: beside it on large screens, below it on
// small ones. Left/right arrow keys move between thumbnails.
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeImage = images[activeIndex] ?? images[0];

  function onKeyDown(e: React.KeyboardEvent) {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (activeIndex + step + images.length) % images.length;
    setActiveIndex(next);
    thumbs.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-3 lg:flex-row-reverse lg:gap-4">
      <div className="relative aspect-square flex-1 overflow-hidden rounded-[2px] bg-frame photo-frame">
        {activeImage && (
          <Image
            src={activeImage}
            alt={`${productName}, view ${activeIndex + 1} of ${images.length}`}
            fill
            className="object-contain p-8 sm:p-12"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible" role="tablist" aria-label="Product images" onKeyDown={onKeyDown}>
          {images.map((image, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={image}
                ref={(el) => {
                  thumbs.current[index] = el;
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Show image ${index + 1}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "relative size-16 shrink-0 overflow-hidden rounded-[2px] bg-frame photo-frame transition-shadow lg:size-20",
                  isActive ? "ring-1 ring-ink ring-offset-2 ring-offset-porcelain" : "opacity-70 hover:opacity-100",
                )}
              >
                <Image src={image} alt="" fill className="object-contain p-1.5" sizes="80px" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
