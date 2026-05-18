"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  completePhantomRequestAction,
  updatePhantomRequestStatusAction,
} from "@/actions/phantom";
import { buttonVariants } from "@/components/ui/button";
import {
  PHANTOM_AMOUNT_EUR,
  phantomStatusLabelFr,
  type AdminPhantomRequest,
  type PhantomRequestStatus,
} from "@/lib/phantom/requests";
import { cn } from "@/lib/utils";

type AdminPhantomRequestsSectionProps = {
  requests: AdminPhantomRequest[];
};

function statusTone(status: PhantomRequestStatus): string {
  switch (status) {
    case "pending":
      return "border-amber-500/30 bg-amber-500/10 text-amber-100";
    case "accepted":
    case "payment_pending":
      return "border-sky-400/30 bg-sky-400/10 text-sky-100";
    case "paid":
    case "in_progress":
      return "border-emerald-400/30 bg-emerald-400/10 text-emerald-100";
    case "completed":
      return "border-emerald-300/40 bg-emerald-300/15 text-emerald-50";
    case "refused":
    case "cancelled":
      return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  }
}

export function AdminPhantomRequestsSection({
  requests,
}: AdminPhantomRequestsSectionProps) {
  const [busy, start] = useTransition();

  function updateStatus(
    requestId: string,
    status: Exclude<PhantomRequestStatus, "pending" | "completed">,
    message: string,
  ) {
    start(async () => {
      const res = await updatePhantomRequestStatusAction(requestId, status);
      if (res.ok) {
        toast.success(message);
      } else {
        toast.error(res.error);
      }
    });
  }

  function complete(requestId: string) {
    start(async () => {
      const res = await completePhantomRequestAction(requestId);
      if (res.ok) {
        toast.success("Mode Phantom terminé — comptabilité mise à jour");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
            Service premium
          </p>
          <h2 className="text-lg font-semibold tracking-tight">Mode Phantom</h2>
        </div>
        <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
          {PHANTOM_AMOUNT_EUR}€
        </span>
      </div>

      {requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
          Aucune demande Mode Phantom à traiter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {requests.map((request) => {
            const profile = request.profiles;
            return (
              <li
                key={request.id}
                className="flex flex-col gap-4 rounded-2xl border border-amber-200/15 bg-linear-to-br from-amber-500/10 via-card/35 to-black/20 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {profile?.full_name?.trim() || profile?.email || "Client"}
                    </p>
                    {profile?.email ? (
                      <p className="text-xs text-muted-foreground">
                        {profile.email}
                      </p>
                    ) : null}
                    {profile?.snap ? (
                      <p className="text-xs text-amber-100/80">{profile.snap}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Demandé le{" "}
                      {new Date(request.created_at).toLocaleString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                      statusTone(request.status),
                    )}
                  >
                    {phantomStatusLabelFr[request.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {request.status === "pending" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateStatus(
                            request.id,
                            "accepted",
                            "Demande Mode Phantom acceptée",
                          )
                        }
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "h-11 justify-center bg-emerald-600 text-white hover:bg-emerald-600/90",
                        )}
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateStatus(
                            request.id,
                            "refused",
                            "Demande Mode Phantom refusée",
                          )
                        }
                        className={cn(
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "h-11 justify-center border-rose-500/40 text-rose-100 hover:bg-rose-500/10",
                        )}
                      >
                        Refuser
                      </button>
                    </>
                  ) : null}

                  {request.status === "accepted" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "payment_pending",
                          "Paiement Mode Phantom en attente",
                        )
                      }
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "col-span-2 h-11 justify-center bg-sky-600 text-white hover:bg-sky-600/90",
                      )}
                    >
                      Marquer paiement en attente
                    </button>
                  ) : null}

                  {request.status === "payment_pending" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "paid",
                          "Paiement Mode Phantom reçu",
                        )
                      }
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "col-span-2 h-11 justify-center bg-emerald-600 text-white hover:bg-emerald-600/90",
                      )}
                    >
                      Marquer paiement reçu
                    </button>
                  ) : null}

                  {request.status === "paid" ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          updateStatus(
                            request.id,
                            "in_progress",
                            "Intervention Mode Phantom en cours",
                          )
                        }
                        className={cn(
                          buttonVariants({ variant: "default", size: "lg" }),
                          "h-11 justify-center bg-amber-500 text-black hover:bg-amber-400",
                        )}
                      >
                        Intervention en cours
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => complete(request.id)}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "lg" }),
                          "h-11 justify-center border-emerald-500/40 text-emerald-100 hover:bg-emerald-500/10",
                        )}
                      >
                        Terminé
                      </button>
                    </>
                  ) : null}

                  {request.status === "in_progress" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => complete(request.id)}
                      className={cn(
                        buttonVariants({ variant: "default", size: "lg" }),
                        "col-span-2 h-11 justify-center bg-emerald-600 text-white hover:bg-emerald-600/90",
                      )}
                    >
                      Marquer terminé
                    </button>
                  ) : null}

                  {request.status !== "pending" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateStatus(
                          request.id,
                          "cancelled",
                          "Demande Mode Phantom annulée",
                        )
                      }
                      className={cn(
                        buttonVariants({ variant: "outline", size: "lg" }),
                        "col-span-2 h-11 justify-center border-rose-500/35 text-rose-100 hover:bg-rose-500/10",
                      )}
                    >
                      Annuler
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
