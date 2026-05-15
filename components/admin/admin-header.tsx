"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { AdminMobileMenu } from "@/components/admin/admin-mobile-menu";
import { AdminNavBar } from "@/components/admin/admin-nav-bar";
import {
  getAdminNavTitle,
  isAdminDashboard,
} from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

type AdminHeaderProps = {
  adminDisplayName: string;
};

export function AdminHeader({ adminDisplayName }: AdminHeaderProps) {
  const pathname = usePathname();
  const title = getAdminNavTitle(pathname);
  const onDashboard = isAdminDashboard(pathname);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/95 backdrop-blur-xl supports-backdrop-filter:bg-background/80">
      <div className="mx-auto w-full max-w-lg px-5 pb-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2 pb-3">
          {!onDashboard ? (
            <Link
              href="/admin"
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-zinc-100 transition active:scale-95",
              )}
              aria-label="Retour au dashboard admin"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/90">
              Admin
            </p>
            <h1 className="truncate text-xl font-semibold tracking-tight">
              {title}
            </h1>
          </div>
          <AdminMobileMenu adminDisplayName={adminDisplayName} />
        </div>
      </div>
      <AdminNavBar />
    </header>
  );
}
