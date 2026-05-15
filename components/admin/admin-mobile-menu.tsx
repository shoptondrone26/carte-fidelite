"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MoreVertical, X } from "lucide-react";

import { signOut } from "@/actions/auth";
import { buttonVariants } from "@/components/ui/button";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

type AdminMobileMenuProps = {
  adminDisplayName: string;
};

export function AdminMobileMenu({ adminDisplayName }: AdminMobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-zinc-100 backdrop-blur-md transition active:scale-95",
        )}
        aria-label="Menu administration"
        aria-expanded={open}
      >
        <MoreVertical className="size-5" aria-hidden />
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-200 flex flex-col justify-end bg-black/55 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation admin"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-lg rounded-t-[1.75rem] border border-white/10 bg-zinc-950/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90">
                  Administration
                </p>
                <p className="mt-1 text-sm text-zinc-400">{adminDisplayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-full bg-white/10 text-zinc-300"
                aria-label="Fermer le menu"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <nav className="flex flex-col gap-1">
              {ADMIN_NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3.5 transition active:scale-[0.99]",
                      active
                        ? "bg-amber-500/15 text-amber-50 ring-1 ring-amber-400/25"
                        : "text-zinc-200 hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        active ? "bg-amber-500/20" : "bg-white/5",
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold tracking-tight">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-zinc-500">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-5">
              <Link
                href="/"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 justify-center border-white/15 bg-transparent",
                )}
              >
                Accueil public
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ variant: "secondary", size: "lg" }),
                    "h-11 w-full justify-center",
                  )}
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
