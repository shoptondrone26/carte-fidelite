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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-100/10 bg-black/80 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl transition-[background-color,backdrop-filter] duration-700 supports-backdrop-filter:bg-black/65"
    >
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
                  "group flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-1.5 text-[10px] font-semibold tracking-wide transition duration-500",
                  active
                    ? "bg-amber-300/10 text-amber-50 shadow-[0_0_28px_rgba(245,158,11,0.12)]"
                    : "text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full border transition duration-500",
                    active
                      ? "border-amber-300/40 bg-amber-300/15 text-amber-200 shadow-[0_0_20px_rgba(252,211,77,0.18)]"
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
