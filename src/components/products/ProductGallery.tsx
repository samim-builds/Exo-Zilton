"use client";

import Image from "next/image";
import { useState } from "react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-lg bg-porcelain">
        <Image
          src={images[activeIndex]}
          alt={`${productName} — view ${activeIndex + 1}`}
          fill
          className="object-contain p-8"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-charcoal/60 px-3 py-1 text-xs text-white">
          {activeIndex + 1}/{images.length}
        </span>
      </div>

      <div className="mt-4 flex gap-3">
        {images.map((image, index) => (
          <button
            key={image}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View image ${index + 1}`}
            aria-current={activeIndex === index}
            className={`relative h-20 w-20 overflow-hidden rounded-md border-2 bg-porcelain transition-colors ${activeIndex === index ? "border-navy" : "border-transparent hover:border-gold"}`}
          >
            <Image
              src={image}
              alt=""
              fill
              className="object-contain p-2"
              sizes="80px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
