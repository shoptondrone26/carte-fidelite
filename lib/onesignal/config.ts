export function isOneSignalClientEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim());
}

export function isOneSignalSendEnabled(): boolean {
  return (
    isOneSignalClientEnabled() &&
    Boolean(process.env.ONESIGNAL_REST_API_KEY?.trim())
  );
}

/** @deprecated Alias — envoi serveur */
export function isOneSignalEnabled(): boolean {
  return isOneSignalSendEnabled();
}

export function getOneSignalAppId(): string {
  const id = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim();
  if (!id) {
    throw new Error("NEXT_PUBLIC_ONESIGNAL_APP_ID manquant");
  }
  return id;
}

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
