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
  return (
    <div className="flex flex-col gap-4 pb-4">
      <p className="text-sm text-muted-foreground">
        Validez un déblocage après passage du client — la réservation seule ne
        crédite pas de tampon.
      </p>
      {addressBook.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucun client inscrit.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {addressBook.map((c) => (
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
