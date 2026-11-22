"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@workspace/ui/lib/utils";
import type { ProductImage } from "@/lib/catalog";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);

  if (!images || images.length === 0) {
    return null;
  }

  const activeImage = images[activeImageIndex] || images[0];

  if (!activeImage) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted shadow-sm">
        {/* SVG/img representation */}
        <Image
          src={activeImage.src}
          alt={activeImage.alt || title}
          width={activeImage.width || 800}
          height={activeImage.height || 800}
          className="h-full w-full object-cover transition-opacity duration-300"
          priority
        />
      </div>

      {images.length > 1 && (
        <div
          className="flex flex-wrap gap-3"
          role="group"
          aria-label="Product image gallery thumbnails"
        >
          {images.map((img, idx) => {
            const isActive = idx === activeImageIndex;
            return (
              <button
                key={img.id || idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                aria-label={`View image ${idx + 1} of ${images.length}: ${
                  img.alt || title
                }`}
                aria-pressed={isActive}
                className={cn(
                  "relative h-20 w-20 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border bg-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "border-primary ring-2 ring-primary ring-offset-2 opacity-100"
                    : "border-border opacity-70 hover:opacity-100"
                )}
              >
                <Image
                  src={img.src}
                  alt=""
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
