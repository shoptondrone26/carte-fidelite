"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ClientPrivateHeader } from "@/components/client/client-private-header";
import { isClientPrivatePath } from "@/lib/client/navigation";
import { cn } from "@/lib/utils";

type ClientAppChromeProps = {
  children: ReactNode;
};

export function ClientAppChrome({ children }: ClientAppChromeProps) {
  const pathname = usePathname();
  const showPrivateChrome = isClientPrivatePath(pathname);

  return (
    <>
      {showPrivateChrome ? <ClientPrivateHeader /> : null}
      <div
        className={cn(
          "flex flex-1 flex-col",
          showPrivateChrome ? "min-h-0" : undefined,
        )}
      >
        {children}
      </div>
    </>
  );
}
