"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MOBILE_NAV_ITEMS } from "@/lib/constants/navigation";
import type { NavItem } from "@/types";
import { cn } from "@/lib/utils";

function isMobileNavActive(item: NavItem, pathname: string): boolean {
  if (item.href === "/") {
    return pathname === "/";
  }
  if (item.href === "/dashboard") {
    return (
      pathname === "/dashboard" ||
      pathname.startsWith("/dashboard/") ||
      pathname.startsWith("/deblocage")
    );
  }
  return pathname.startsWith(item.href);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-100/10 bg-black/75 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-22px_70px_rgba(0,0,0,0.68)] backdrop-blur-3xl transition-[background-color,backdrop-filter] duration-700 supports-backdrop-filter:bg-black/58"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-200/50 to-transparent"
      />
      <div
        aria-hidden
        className="premium-ambient pointer-events-none absolute inset-x-8 bottom-1 h-12 rounded-full bg-amber-300/12 blur-3xl"
      />
      <ul className="mx-auto flex w-full max-w-xs items-stretch justify-center gap-4 rounded-[2rem] border border-white/4 bg-white/2.5 px-3 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isMobileNavActive(item, pathname);
          const Icon = item.icon;

          return (
            <li key={item.href} className="min-w-[7.25rem] flex-1">
              <Link
                href={item.href}
                className={cn(
                  "group relative flex min-h-16 flex-col items-center justify-center gap-1 overflow-hidden rounded-[1.35rem] px-1.5 py-1.5 text-[10px] font-semibold tracking-wide transition duration-700 active:scale-[0.97]",
                  active
                    ? "bg-linear-to-b from-amber-200/18 via-amber-500/8 to-white/3 text-amber-50 shadow-[0_0_34px_rgba(245,158,11,0.18)]"
                    : "text-zinc-500 hover:bg-white/3.5 hover:text-zinc-200",
                )}
              >
                {active ? (
                  <span
                    aria-hidden
                    className="absolute inset-x-4 top-0 h-px bg-linear-to-r from-transparent via-amber-100/80 to-transparent"
                  />
                ) : null}
                {active ? (
                  <span
                    aria-hidden
                    className="premium-ambient absolute inset-x-2 bottom-1 h-8 rounded-full bg-amber-300/12 blur-xl"
                  />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-full border transition duration-700",
                    active
                      ? "border-amber-300/50 bg-amber-300/22 text-amber-100 shadow-[0_0_30px_rgba(252,211,77,0.28),inset_0_1px_0_rgba(255,255,255,0.18)]"
                      : "border-white/5 bg-white/3.5 text-zinc-500 group-hover:text-zinc-200",
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
