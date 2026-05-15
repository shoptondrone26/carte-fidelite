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
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border/60 bg-background/85 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl transition-[background-color,backdrop-filter] duration-200 supports-backdrop-filter:bg-background/70"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around gap-1 px-2">
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
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium tracking-wide transition-colors",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full border transition-colors",
                    active
                      ? "border-amber-400/40 bg-amber-400/10 text-amber-200"
                      : "border-transparent bg-muted/40",
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
