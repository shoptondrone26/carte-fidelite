import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { StatCard } from "@/components/admin/admin-ui";
import type {
  AdminBookingRow,
  AdminClientRow,
  AdminStats,
} from "@/components/admin/admin-types";
import { AdminPendingRequestsSection } from "@/components/admin/views/admin-bookings-view";
import { AdminPhantomRequestsSection } from "@/components/admin/views/admin-phantom-requests-section";
import { AdminShopOrdersSection } from "@/components/admin/shop/admin-shop-orders-section";
import { ADMIN_NAV_ITEMS } from "@/lib/admin/navigation";
import type { AdminShopOrder } from "@/lib/boutique/orders";
import type { AdminPhantomRequest } from "@/lib/phantom/requests";
type AdminHomeViewProps = {
  stats: AdminStats;
  topClients: AdminClientRow[];
  pending: AdminBookingRow[];
  phantomRequests: AdminPhantomRequest[];
  shopOrders: AdminShopOrder[];
};

export function AdminHomeView({
  stats,
  topClients,
  pending,
  phantomRequests,
  shopOrders,
}: AdminHomeViewProps) {
  const shortcuts = ADMIN_NAV_ITEMS.filter((n) => n.href !== "/admin");

  return (
    <div className="flex flex-col gap-8 pb-4">
      <section className="grid grid-cols-2 gap-3">
        <StatCard label="En attente" value={stats.pendingCount} accent="amber" />
        <StatCard label="Clients" value={stats.totalClients} accent="violet" />
        <StatCard
          label="Acceptées (24h)"
          value={stats.acceptedToday}
          accent="emerald"
        />
        <StatCard
          label="Refusées (24h)"
          value={stats.refusedToday}
          accent="rose"
        />
      </section>

      <AdminPendingRequestsSection pending={pending} />

      <AdminPhantomRequestsSection requests={phantomRequests} />

      <AdminShopOrdersSection orders={shopOrders} />

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
          Accès rapide
        </h2>
        <ul className="flex flex-col gap-2">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-4 py-3.5 transition active:scale-[0.99] hover:bg-card/60"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-200">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Top clients</h2>
        <ol className="flex flex-col gap-2">
          {topClients.length === 0 ? (
            <li className="text-sm text-muted-foreground">Aucun client.</li>
          ) : (
            topClients.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/30 px-3 py-2.5"
              >
                <span className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-amber-500/15 text-xs font-bold text-amber-100">
                    {i + 1}
                  </span>
                  <span className="truncate text-sm font-medium">
                    {c.full_name?.trim() || c.email || c.id.slice(0, 8)}
                  </span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                  {c.total_unlocks ?? 0}
                </span>
              </li>
            ))
          )}
        </ol>
      </section>
    </div>
  );
}
