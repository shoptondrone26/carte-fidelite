"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { ADMIN_NAV_ITEMS, isAdminNavActive } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

export function AdminNavBar() {
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
      aria-label="Navigation admin"
      className="border-t border-white/5 bg-background/80"
    >
      <div
        ref={scrollRef}
        className="mx-auto flex w-full max-w-lg gap-2 overflow-x-auto px-5 py-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ADMIN_NAV_ITEMS.map((item) => {
          const active = isAdminNavActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                if (active) activeRef.current = el;
              }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold tracking-tight transition active:scale-[0.97]",
                active
                  ? "bg-amber-500/20 text-amber-50 ring-1 ring-amber-400/30 shadow-sm shadow-amber-900/20"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden />
              {item.shortLabel}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
