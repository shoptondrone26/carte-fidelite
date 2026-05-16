"use client";

import { useMemo, useState } from "react";

import {
  AdminClientCard,
  type AdminClientCardData,
  type AdminHistorySnippet,
} from "@/components/admin/admin-client-card";

type AdminClientsViewProps = {
  addressBook: AdminClientCardData[];
  historyByClient: Record<string, AdminHistorySnippet[]>;
};

export function AdminClientsView({
  addressBook,
  historyByClient,
}: AdminClientsViewProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();
  const filteredClients = useMemo(() => {
    if (!normalizedSearch) return addressBook;
    return addressBook.filter((client) =>
      [client.full_name, client.email, client.snap]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch)),
    );
  }, [addressBook, normalizedSearch]);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="rounded-3xl border border-white/10 bg-linear-to-br from-zinc-900/95 via-zinc-950 to-black p-4 shadow-xl shadow-black/30">
        <div className="flex flex-col gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-amber-200/80">
              Carnet client
            </p>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Recherche rapide
            </h2>
            <p className="text-sm text-zinc-400">
              Filtre en direct par nom, email ou snap.
            </p>
          </div>
          <label className="sr-only" htmlFor="admin-client-search">
            Rechercher un client
          </label>
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-amber-200/70"
            >
              Rech.
            </span>
            <input
              id="admin-client-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, email, snap..."
              className="h-12 w-full rounded-2xl border border-white/10 bg-black/35 pl-16 pr-4 text-base text-white outline-none ring-amber-300/30 transition placeholder:text-zinc-500 focus:border-amber-300/50 focus:ring-4"
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
            <span>
              {filteredClients.length} / {addressBook.length} client
              {addressBook.length > 1 ? "s" : ""}
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-zinc-600">
              Build debug: search-clients-test
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Validez un déblocage après passage du client — la réservation seule ne
        crédite pas de tampon.
      </p>
      {addressBook.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun client inscrit.
        </p>
      ) : filteredClients.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 px-4 py-8 text-center text-sm text-amber-100/80">
          Aucun client ne correspond à cette recherche.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {filteredClients.map((c) => (
            <li key={c.id}>
              <AdminClientCard
                client={c}
                history={historyByClient[c.id] ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
