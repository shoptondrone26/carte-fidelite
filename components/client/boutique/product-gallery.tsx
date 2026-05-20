"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

/** Au-dessus header (z-40), nav (z-50), panier/drawers (z-200). */
const VIEWER_Z_OVERLAY = 9998;
const VIEWER_Z_CLOSE = 10000;

const PAGE_GALLERY_HEIGHT =
  "h-[min(38dvh,280px)] sm:h-[min(42dvh,320px)] lg:h-[min(44dvh,360px)]";

const PAGE_GALLERY_FRAME =
  "rounded-2xl border border-white/10 bg-zinc-950 sm:rounded-3xl";

const FULLSCREEN_IMAGE_MAX_HEIGHT =
  "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 5.5rem)";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

type FullscreenViewerProps = {
  open: boolean;
  images: string[];
  initialIndex: number;
  alt: string;
  onClose: () => void;
};

function scrollFullscreenToIndex(
  scrollEl: HTMLDivElement | null,
  index: number,
  behavior: ScrollBehavior = "instant",
) {
  if (!scrollEl) return;
  const child = scrollEl.children[index] as HTMLElement | undefined;
  if (!child) return;
  child.scrollIntoView({
    behavior,
    inline: "center",
    block: "nearest",
  });
}

function ProductImageFullscreenViewer({
  open,
  images,
  initialIndex,
  alt,
  onClose,
}: FullscreenViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(initialIndex);

  const multi = images.length > 1;
  const safeIndex = Math.min(
    Math.max(0, index),
    Math.max(0, images.length - 1),
  );
  const currentSrc = images[safeIndex] ?? images[0];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
    const id = requestAnimationFrame(() => {
      scrollFullscreenToIndex(scrollRef.current, initialIndex, "instant");
    });
    return () => cancelAnimationFrame(id);
  }, [open, initialIndex]);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, images.length - 1));
      setIndex(clamped);
      scrollFullscreenToIndex(scrollRef.current, clamped, "smooth");
    },
    [images.length],
  );

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (!multi) return;
      if (e.key === "ArrowLeft") goTo(safeIndex - 1);
      if (e.key === "ArrowRight") goTo(safeIndex + 1);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, multi, safeIndex, goTo]);

  function onFullscreenScroll() {
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
    setIndex(closest);
  }

  if (!open || !mounted || !currentSrc) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col bg-black animate-in fade-in duration-200"
      style={{ zIndex: VIEWER_Z_OVERLAY }}
      role="dialog"
      aria-modal="true"
      aria-label="Photo produit en plein écran"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed flex size-11 min-h-11 min-w-11 items-center justify-center rounded-full bg-zinc-900/95 text-white shadow-lg ring-1 ring-white/20 transition active:scale-95"
        style={{
          zIndex: VIEWER_Z_CLOSE,
          top: "calc(env(safe-area-inset-top) + 16px)",
          right: 16,
        }}
        aria-label="Fermer"
      >
        <X className="size-6" strokeWidth={2.5} aria-hidden />
      </button>

      {multi ? (
        <>
          <button
            type="button"
            disabled={safeIndex <= 0}
            onClick={(e) => {
              e.stopPropagation();
              goTo(safeIndex - 1);
            }}
            className="fixed flex size-10 min-h-10 min-w-10 items-center justify-center rounded-full bg-zinc-900/80 text-white/90 ring-1 ring-white/15 transition active:scale-95 disabled:pointer-events-none disabled:opacity-25"
            style={{
              zIndex: VIEWER_Z_CLOSE,
              left: "max(12px, env(safe-area-inset-left))",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            aria-label="Photo précédente"
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
          <button
            type="button"
            disabled={safeIndex >= images.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              goTo(safeIndex + 1);
            }}
            className="fixed flex size-10 min-h-10 min-w-10 items-center justify-center rounded-full bg-zinc-900/80 text-white/90 ring-1 ring-white/15 transition active:scale-95 disabled:pointer-events-none disabled:opacity-25"
            style={{
              zIndex: VIEWER_Z_CLOSE,
              right: "max(12px, env(safe-area-inset-right))",
              top: "50%",
              transform: "translateY(-50%)",
            }}
            aria-label="Photo suivante"
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>

          <p
            className="pointer-events-none fixed left-1/2 -translate-x-1/2 text-[11px] font-medium tabular-nums tracking-wide text-white/45"
            style={{
              zIndex: VIEWER_Z_CLOSE,
              bottom: "calc(env(safe-area-inset-bottom) + 14px)",
            }}
            aria-live="polite"
          >
            {safeIndex + 1}/{images.length}
          </p>
        </>
      ) : null}

      <div
        className="flex min-h-0 flex-1 flex-col"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 4.5rem)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        onClick={onClose}
      >
        {multi ? (
          <div
            ref={scrollRef}
            onScroll={onFullscreenScroll}
            onClick={(e) => e.stopPropagation()}
            className="flex h-full min-h-0 w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((src, i) => (
              <div
                key={src}
                className="flex h-full w-full shrink-0 snap-center snap-always items-center justify-center px-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${alt} — photo ${i + 1}`}
                  className="max-h-full max-w-full object-contain"
                  style={{ maxHeight: FULLSCREEN_IMAGE_MAX_HEIGHT }}
                  draggable={false}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        ) : (
          <div
            className="flex min-h-0 flex-1 items-center justify-center px-4"
            onClick={onClose}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSrc}
              alt={alt}
              className="max-h-full max-w-full object-contain"
              style={{ maxHeight: FULLSCREEN_IMAGE_MAX_HEIGHT }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);

  const closeZoom = useCallback(() => setZoomOpen(false), []);

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
          "relative flex w-full items-center justify-center overflow-hidden",
          PAGE_GALLERY_FRAME,
          PAGE_GALLERY_HEIGHT,
        )}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-zinc-600">
          ShopTonDrone
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-w-0">
        <div
          ref={scrollRef}
          onScroll={onScroll}
          className={cn(
            "flex w-full snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            PAGE_GALLERY_FRAME,
            PAGE_GALLERY_HEIGHT,
            images.length === 1 && "snap-none",
          )}
        >
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setZoomOpen(true)}
              className="relative flex h-full w-full shrink-0 snap-center snap-always items-center justify-center bg-zinc-950"
              aria-label={`${productName} — photo ${i + 1}, agrandir`}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                className="object-contain p-2"
                sizes="(max-width: 768px) 100vw, 560px"
                priority={i === 0}
              />
              <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/90 backdrop-blur-sm">
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

      <ProductImageFullscreenViewer
        open={zoomOpen}
        images={images}
        initialIndex={activeIndex}
        alt={productName}
        onClose={closeZoom}
      />
    </>
  );
}
