"use client";

import { useRef, useTransition } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { updateShopProductImageAction } from "@/actions/shop-products";
import {
  buildShopProductImagePath,
  getShopProductPublicUrl,
  SHOP_PRODUCTS_BUCKET,
} from "@/lib/boutique/storage";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type AdminProductImageUploadProps = {
  productId: string;
  imageUrl: string | null;
  onUpdated: (imageUrl: string | null) => void;
};

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function AdminProductImageUpload({
  productId,
  imageUrl,
  onUpdated,
}: AdminProductImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function onPick() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ACCEPT.split(",").includes(file.type)) {
      toast.error("Format non supporté", {
        description: "JPEG, PNG, WebP ou GIF uniquement.",
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      toast.error("Image trop lourde", {
        description: "Taille maximale : 5 Mo.",
      });
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const path = buildShopProductImagePath(productId, file.name);

      const { error: uploadError } = await supabase.storage
        .from(SHOP_PRODUCTS_BUCKET)
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (uploadError) {
        toast.error("Upload impossible", { description: uploadError.message });
        return;
      }

      const publicUrl = getShopProductPublicUrl(path);
      const res = await updateShopProductImageAction(productId, publicUrl);

      if (res.ok) {
        onUpdated(publicUrl);
        toast.success("Photo mise à jour");
      } else {
        toast.error("Enregistrement impossible", { description: res.error });
      }
    });
  }

  function onRemove() {
    startTransition(async () => {
      const res = await updateShopProductImageAction(productId, null);
      if (res.ok) {
        onUpdated(null);
        toast.success("Photo retirée");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Photo produit
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className={cn(
            "relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-zinc-900",
          )}
        >
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-8 text-zinc-600" aria-hidden />
          )}
          {pending ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 className="size-6 animate-spin text-amber-200" />
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            onChange={onFileChange}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onPick}
            className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-semibold text-amber-100 transition hover:bg-amber-300/15 disabled:opacity-50"
          >
            {imageUrl ? "Remplacer" : "Ajouter une photo"}
          </button>
          {imageUrl ? (
            <button
              type="button"
              disabled={pending}
              onClick={onRemove}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-400 transition hover:bg-white/5 disabled:opacity-50"
            >
              Retirer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
