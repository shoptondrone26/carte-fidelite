import { after } from "next/server";

async function safeRun(task: () => Promise<void>, label: string): Promise<void> {
  try {
    await task();
  } catch (err) {
    // eslint-disable-next-line no-console -- log non bloquant post-réponse
    console.error(
      `[after-response:${label}] tâche échouée :`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * Exécute `task` après la réponse de la Server Action / Route Handler.
 *
 * - En contexte server valide (Vercel serverless / Node runtime), utilise
 *   `after()` Next.js 16 qui s’appuie sur `waitUntil` pour garantir
 *   l’exécution sans bloquer la réponse.
 * - Hors contexte (tests, scripts CLI) ou si `after()` lève une exception
 *   synchrone, retombe sur un fire-and-forget direct (`void task()`).
 *
 * Aucune erreur n’est propagée à l’UI : on se contente de logger.
 */
export function runAfterResponse(task: () => Promise<void>): void {
  try {
    after(() => safeRun(task, "after"));
  } catch (err) {
    // eslint-disable-next-line no-console -- diag fallback push
    console.error(
      "[after-response:after-unavailable]",
      err instanceof Error ? err.message : String(err),
    );
    void safeRun(task, "fallback");
  }
}
