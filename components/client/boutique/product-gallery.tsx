"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const goTo = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (!child) return;
    setActiveIndex(index);
    child.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, []);

  function onScroll() {
    const el = scrollRef.current;
    if (!el || images.length < 2) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let closest = 0;
    let minDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const node = child as HTMLElement;
      const childCenter = node.offsetLeft + node.offsetWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    });
    setActiveIndex(closest);
  }

  if (images.length === 0) {
    return (
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-zinc-900 via-zinc-950 to-black sm:aspect-square sm:rounded-3xl">
        <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-600">
          ShopTonDrone
        </div>
      </div>
    );
  }

  const activeSrc = images[activeIndex] ?? images[0]!;

  return (
    <>
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className={cn(
            "flex aspect-[4/5] w-full snap-x snap-mandatory overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900 [-ms-overflow-style:none] [scrollbar-width:none] sm:aspect-square sm:rounded-3xl [&::-webkit-scrollbar]:hidden",
            images.length === 1 && "snap-none",
          )}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoomOpen(true)}
              className="relative h-full w-full shrink-0 snap-center snap-always"
              aria-label={`${productName} — photo ${i + 1}`}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 560px"
                priority={i === 0}
              />
              <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/90 backdrop-blur-sm">
                <ZoomIn className="size-4" aria-hidden />
              </span>
            </button>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="mt-3 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === activeIndex
                    ? "w-6 bg-amber-400"
                    : "w-1.5 bg-white/25 hover:bg-white/40",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {zoomOpen ? (
        <div
          className="fixed inset-0 z-300 flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Zoom photo produit"
          onClick={() => setZoomOpen(false)}
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 flex size-10 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
          <div
            className="relative m-auto flex h-full w-full max-w-lg items-center justify-center p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSrc}
              alt={productName}
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
