import type { SupabaseClient } from "@supabase/supabase-js";

export const PHANTOM_AMOUNT_EUR = 500;

export type PhantomRequestStatus =
  | "pending"
  | "accepted"
  | "payment_pending"
  | "paid"
  | "in_progress"
  | "completed"
  | "refused"
  | "cancelled";

export type PhantomRequest = {
  id: string;
  profile_id: string;
  status: PhantomRequestStatus;
  amount_eur: number;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  accepted_at: string | null;
  payment_pending_at: string | null;
  paid_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  handled_by: string | null;
};

export type AdminPhantomRequest = PhantomRequest & {
  profiles: {
    full_name: string | null;
    email: string | null;
    snap: string | null;
  } | null;
};

type PhantomRequestRow = Omit<PhantomRequest, "status" | "amount_eur"> & {
  status: string;
  amount_eur: number;
};

type PhantomProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  snap: string | null;
};

export const PHANTOM_ACTIVE_STATUSES: PhantomRequestStatus[] = [
  "pending",
  "accepted",
  "payment_pending",
  "paid",
  "in_progress",
];

export const phantomStatusLabelFr: Record<PhantomRequestStatus, string> = {
  pending: "Demande envoyée",
  accepted: "Demande acceptée",
  payment_pending: "Paiement en attente",
  paid: "Paiement reçu",
  in_progress: "Intervention en cours",
  completed: "Mode Fantôme terminé",
  refused: "Refusée",
  cancelled: "Annulée",
};

export function phantomClientMessage(status: PhantomRequestStatus): string {
  switch (status) {
    case "pending":
      return "Votre demande Mode Fantôme a été envoyée.";
    case "accepted":
      return "Votre demande Mode Fantôme a été acceptée.";
    case "payment_pending":
      return "Rendez-vous sur Snapchat pour finaliser le paiement avec ShopTonDrone.";
    case "paid":
      return "Paiement confirmé. L’intervention est en préparation.";
    case "in_progress":
      return "Mode Fantôme en cours.";
    case "completed":
      return "Mode Fantôme terminé.";
    case "refused":
    case "cancelled":
      return "Demande annulée.";
  }
}

export function phantomRequestsChannelName(userId: string): string {
  return `phantom:${userId}`;
}

function isPhantomStatus(status: string): status is PhantomRequestStatus {
  return [
    "pending",
    "accepted",
    "payment_pending",
    "paid",
    "in_progress",
    "completed",
    "refused",
    "cancelled",
  ].includes(status);
}

export function mapPhantomRequest(row: PhantomRequestRow): PhantomRequest | null {
  if (!isPhantomStatus(row.status)) return null;
  return {
    id: row.id,
    profile_id: row.profile_id,
    status: row.status,
    amount_eur: Number(row.amount_eur),
    admin_note: row.admin_note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    accepted_at: row.accepted_at,
    payment_pending_at: row.payment_pending_at,
    paid_at: row.paid_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    cancelled_at: row.cancelled_at,
    handled_by: row.handled_by,
  };
}

function mapAdminPhantomRequest(
  row: PhantomRequestRow,
  profilesById: Map<string, PhantomProfileRow>,
): AdminPhantomRequest | null {
  const request = mapPhantomRequest(row);
  if (!request) return null;
  const profile = profilesById.get(request.profile_id) ?? null;
  return {
    ...request,
    profiles: profile
      ? {
          full_name: profile.full_name,
          email: profile.email,
          snap: profile.snap ?? null,
        }
      : null,
  };
}

export async function fetchClientPhantomRequest(
  supabase: SupabaseClient,
  userId: string,
): Promise<PhantomRequest | null> {
  const { data, error } = await supabase
    .from("phantom_requests")
    .select(
      "id, profile_id, status, amount_eur, admin_note, created_at, updated_at, accepted_at, payment_pending_at, paid_at, started_at, completed_at, cancelled_at, handled_by",
    )
    .eq("profile_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? mapPhantomRequest(data as PhantomRequestRow) : null;
}

export async function fetchAdminPhantomRequests(
  supabase: SupabaseClient,
): Promise<AdminPhantomRequest[]> {
  const { data, error } = await supabase
    .from("phantom_requests")
    .select(
      "id, profile_id, status, amount_eur, admin_note, created_at, updated_at, accepted_at, payment_pending_at, paid_at, started_at, completed_at, cancelled_at, handled_by",
    )
    .in("status", PHANTOM_ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("fetchAdminPhantomRequests", error.message);
    return [];
  }

  const rows = (data as PhantomRequestRow[] | null) ?? [];
  const profileIds = [...new Set(rows.map((row) => row.profile_id))];
  const profilesById = new Map<string, PhantomProfileRow>();

  if (profileIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, snap")
      .in("id", profileIds);

    if (profileError) {
      console.error("fetchAdminPhantomProfiles", profileError.message);
    } else {
      for (const profile of (profiles as PhantomProfileRow[] | null) ?? []) {
        profilesById.set(profile.id, profile);
      }
    }
  }

  return rows
    .map((row) => mapAdminPhantomRequest(row, profilesById))
    .filter((row): row is AdminPhantomRequest => Boolean(row));
}
