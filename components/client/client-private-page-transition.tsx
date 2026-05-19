"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ClientPrivatePageTransitionProps = {
  children: ReactNode;
};

export function ClientPrivatePageTransition({
  children,
}: ClientPrivatePageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className={cn(
        "flex flex-1 flex-col",
        "animate-in fade-in slide-in-from-bottom-1 duration-300 ease-out motion-reduce:animate-none",
      )}
    >
      {children}
    </div>
  );
}
