"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  CLIENT_NAV_ITEMS,
  isClientNavActive,
} from "@/lib/client/navigation";
import { cn } from "@/lib/utils";

export function ClientNavBar() {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const container = scrollRef.current;
    const active = activeRef.current;
    if (!container || !active) return;
    const left =
      active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [pathname]);

  return (
    <nav
      aria-label="Navigation espace privé"
      className="relative border-t border-amber-100/8 bg-black/40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-200/35 to-transparent"
      />
      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-lg gap-2 overflow-x-auto px-5 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {CLIENT_NAV_ITEMS.map((item) => {
          const active = isClientNavActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                if (active) activeRef.current = el;
              }}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold tracking-tight transition duration-500 active:scale-[0.97]",
                active
                  ? "bg-amber-500/20 text-amber-50 ring-1 ring-amber-400/35 shadow-sm shadow-amber-900/25 shadow-[0_0_22px_rgba(245,158,11,0.14)]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span
                  aria-hidden
                  className="premium-ambient pointer-events-none absolute inset-x-3 -bottom-px h-4 rounded-full bg-amber-300/20 blur-md"
                />
              ) : null}
              <Icon className="relative size-3.5 shrink-0" aria-hidden />
              <span className="relative">{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
