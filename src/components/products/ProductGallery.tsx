"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden border border-hairline bg-porcelain">
        {activeImage && (
          <Image
            src={activeImage}
            alt={`${productName} — view ${activeIndex + 1}`}
            fill
            className="object-contain p-10 sm:p-14"
            sizes="(max-width: 1024px) 100vw, 62vw"
            priority
          />
        )}
      </div>

      <div className="mt-8 flex items-center gap-4" role="tablist" aria-label="Product views">
        {images.map((image, index) => {
          const isActive = activeIndex === index;

          return (
            <button
              key={image}
              type="button"
              role="tab"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-current={isActive ? "true" : undefined}
              aria-selected={isActive}
              className={`h-px transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                isActive ? "w-16 bg-bronze" : "w-8 bg-hairline hover:bg-bronze/70"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
