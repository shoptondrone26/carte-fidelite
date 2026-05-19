"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ClientPrivateHeader } from "@/components/client/client-private-header";
import { ClientPrivatePageTransition } from "@/components/client/client-private-page-transition";
import { isClientPrivatePath } from "@/lib/client/navigation";

type ClientAppChromeProps = {
  children: ReactNode;
};

export function ClientAppChrome({ children }: ClientAppChromeProps) {
  const pathname = usePathname();
  const showPrivateChrome = isClientPrivatePath(pathname);

  return (
    <>
      {showPrivateChrome ? <ClientPrivateHeader /> : null}
      {showPrivateChrome ? (
        <ClientPrivatePageTransition>{children}</ClientPrivatePageTransition>
      ) : (
        <div className="flex flex-1 flex-col">{children}</div>
      )}
    </>
  );
}
