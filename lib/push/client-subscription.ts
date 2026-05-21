/** Champs profil utilisés pour savoir si le client reçoit déjà les push. */
export type ClientPushProfileFields = {
  push_enabled: boolean;
  onesignal_subscription_id: string | null;
};

export function isClientPushSubscribed(
  profile: ClientPushProfileFields | null | undefined,
): boolean {
  if (!profile) return false;
  return (
    profile.push_enabled !== false &&
    Boolean(profile.onesignal_subscription_id?.trim())
  );
}
