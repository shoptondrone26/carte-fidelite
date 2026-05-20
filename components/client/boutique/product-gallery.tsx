"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

/** Hauteur galerie sur la page produit (le zoom reste plein écran). */
const PAGE_GALLERY_HEIGHT =
  "h-[min(38dvh,280px)] sm:h-[min(42dvh,320px)] lg:h-[min(44dvh,360px)]";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const closeZoom = useCallback(() => setZoomOpen(false), []);

  useEffect(() => {
    if (!zoomOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeZoom();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomOpen, closeZoom]);

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
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-zinc-900 via-zinc-950 to-black sm:rounded-3xl",
          PAGE_GALLERY_HEIGHT,
        )}
      >
        <div className="flex h-full items-center justify-center text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-600">
          ShopTonDrone
        </div>
      </div>
    );
  }

  const activeSrc = images[activeIndex] ?? images[0]!;

  return (
    <>
      <div className="relative min-w-0">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className={cn(
            "flex w-full snap-x snap-mandatory overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900 [-ms-overflow-style:none] [scrollbar-width:none] sm:rounded-3xl [&::-webkit-scrollbar]:hidden",
            PAGE_GALLERY_HEIGHT,
            images.length === 1 && "snap-none",
          )}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoomOpen(true)}
              className="relative h-full w-full shrink-0 snap-center snap-always"
              aria-label={`${productName} — photo ${i + 1}, agrandir`}
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
          className="fixed inset-0 z-[400] flex flex-col bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Zoom photo produit"
          onClick={closeZoom}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-[410] h-[calc(env(safe-area-inset-top)+3.5rem)] bg-linear-to-b from-black/80 to-transparent"
            aria-hidden
          />

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              closeZoom();
            }}
            className="fixed right-4 z-[420] flex size-12 items-center justify-center rounded-full border-2 border-white/20 bg-black/75 text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-sm transition hover:bg-black/90 active:scale-95"
            style={{ top: "max(12px, env(safe-area-inset-top))" }}
            aria-label="Fermer le zoom"
          >
            <X className="size-6" strokeWidth={2.5} aria-hidden />
          </button>

          <div
            className="relative z-[405] m-auto flex min-h-0 w-full flex-1 items-center justify-center px-4 pt-[calc(env(safe-area-inset-top)+3.5rem)] pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSrc}
              alt={productName}
              className="max-h-[min(85dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-2rem))] max-w-full object-contain"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
