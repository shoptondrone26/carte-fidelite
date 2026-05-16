"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOBILE_NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-100/10 bg-black/70 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_55px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-[background-color,backdrop-filter] duration-700 supports-backdrop-filter:bg-black/55"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-200/50 to-transparent"
      />
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-10 bottom-1 h-10 rounded-full bg-amber-300/10 blur-2xl"
      />
      <ul className="mx-auto flex max-w-md items-stretch justify-around gap-1.5 px-2">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "group relative flex min-h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl px-1.5 py-1.5 text-[10px] font-semibold tracking-wide transition duration-700 active:scale-[0.97]",
                  active
                    ? "bg-linear-to-b from-amber-200/15 to-amber-500/5 text-amber-50 shadow-[0_0_30px_rgba(245,158,11,0.14)]"
                    : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-amber-100/80 to-transparent"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-full border transition duration-700",
                    active
                      ? "border-amber-300/45 bg-amber-300/20 text-amber-100 shadow-[0_0_26px_rgba(252,211,77,0.24)]"
                      : "border-white/5 bg-white/[0.035] text-zinc-500 group-hover:text-zinc-200",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
