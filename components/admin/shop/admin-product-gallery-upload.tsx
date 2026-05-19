"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Star } from "lucide-react";
import { toast } from "sonner";

import { updateShopProductImagesAction } from "@/actions/shop-products";
import {
  buildShopProductImagePath,
  getShopProductPublicUrl,
  SHOP_PRODUCTS_BUCKET,
} from "@/lib/boutique/storage";
import { MAX_PRODUCT_IMAGES } from "@/lib/boutique/images";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type AdminProductGalleryUploadProps = {
  productId: string;
  imageUrls: string[];
  primaryImageIndex: number;
  onUpdated: (urls: string[], primaryIndex: number) => void;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function AdminProductGalleryUpload({
  productId,
  imageUrls,
  primaryImageIndex,
  onUpdated,
}: AdminProductGalleryUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [slotIndex, setSlotIndex] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  function persist(urls: string[], primary: number) {
    startTransition(async () => {
      const res = await updateShopProductImagesAction(
        productId,
        urls,
        primary,
      );
      if (res.ok) {
        onUpdated(urls, primary);
        toast.success("Galerie mise à jour");
      } else {
        toast.error(res.error);
      }
    });
  }

  function onPick(index: number) {
    if (imageUrls.length >= MAX_PRODUCT_IMAGES && !imageUrls[index]) {
      toast.error("Maximum 3 photos");
      return;
    }
    setSlotIndex(index);
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    const index = slotIndex;
    setSlotIndex(null);
    if (!file || index === null) return;

    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non supporté");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const path = buildShopProductImagePath(productId, file.name);
      const { error: uploadError } = await supabase.storage
        .from(SHOP_PRODUCTS_BUCKET)
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (uploadError) {
        toast.error(uploadError.message);
        return;
      }

      const publicUrl = getShopProductPublicUrl(path);
      const next = [...imageUrls];
      while (next.length <= index) next.push("");
      next[index] = publicUrl;
      const cleaned = next.filter(Boolean).slice(0, MAX_PRODUCT_IMAGES);
      const primary =
        primaryImageIndex < cleaned.length ? primaryImageIndex : 0;
      persist(cleaned, primary);
    });
  }

  function onRemove(index: number) {
    const next = imageUrls.filter((_, i) => i !== index);
    const primary =
      primaryImageIndex >= next.length
        ? Math.max(0, next.length - 1)
        : primaryImageIndex > index
          ? primaryImageIndex - 1
          : primaryImageIndex;
    persist(next, next.length ? primary : 0);
  }

  function onSetPrimary(index: number) {
    if (!imageUrls[index]) return;
    persist(imageUrls, index);
  }

  const slots = Array.from({ length: MAX_PRODUCT_IMAGES }, (_, i) => imageUrls[i] ?? null);

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Galerie (max {MAX_PRODUCT_IMAGES} photos)
      </p>
      <div className="flex flex-wrap gap-3">
        {slots.map((url, i) => (
          <div
            key={i}
            className="relative flex size-24 flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900"
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-full object-cover" />
            ) : (
              <ImagePlus className="size-7 text-zinc-600" aria-hidden />
            )}
            {pending ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <Loader2 className="size-5 animate-spin text-amber-200" />
              </div>
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-0.5 bg-black/70 p-1">
              {url ? (
                <>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onSetPrimary(i)}
                    className={cn(
                      "rounded p-1",
                      primaryImageIndex === i
                        ? "text-amber-300"
                        : "text-zinc-500 hover:text-zinc-300",
                    )}
                    aria-label="Photo principale"
                  >
                    <Star
                      className={cn(
                        "size-3.5",
                        primaryImageIndex === i && "fill-current",
                      )}
                    />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => onRemove(i)}
                    className="rounded px-1.5 text-[9px] font-semibold text-rose-300"
                  >
                    Retirer
                  </button>
                </>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => onPick(i)}
                className="rounded px-1.5 text-[9px] font-semibold text-amber-200"
              >
                {url ? "Rempl." : "Ajouter"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={onFileChange}
      />
    </div>
  );
}
