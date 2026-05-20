"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ZoomIn } from "lucide-react";

import { cn } from "@/lib/utils";

/** Au-dessus header (z-40), nav (z-50), panier/drawers (z-200). */
const VIEWER_Z_OVERLAY = 9998;
const VIEWER_Z_CLOSE = 10000;

const PAGE_GALLERY_HEIGHT =
  "h-[min(38dvh,280px)] sm:h-[min(42dvh,320px)] lg:h-[min(44dvh,360px)]";

const PAGE_GALLERY_FRAME =
  "rounded-2xl border border-white/10 bg-zinc-950 sm:rounded-3xl";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

type FullscreenViewerProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

function ProductImageFullscreenViewer({
  open,
  src,
  alt,
  onClose,
}: FullscreenViewerProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

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

      <div
        className="flex min-h-0 flex-1 items-center justify-center px-4"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 4.5rem)",
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
        onClick={onClose}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain"
          style={{
            maxHeight:
              "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 5.5rem)",
          }}
          onClick={(e) => e.stopPropagation()}
        />
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

  const activeSrc = images[activeIndex] ?? images[0]!;

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
        src={activeSrc}
        alt={productName}
        onClose={closeZoom}
      />
    </>
  );
}
