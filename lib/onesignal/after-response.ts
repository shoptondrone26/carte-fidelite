import { after } from "next/server";

/**
 * Exécute `task` après la réponse de la Server Action / Route Handler.
 * Garantie d’exécution sur Vercel (ne pas confondre avec `void task()` qui
 * peut être tué par le runtime serverless dès que la fonction retourne).
 *
 * Conserve le comportement non bloquant : aucune erreur n’est propagée à l’UI.
 */
export function runAfterResponse(task: () => Promise<void>): void {
  try {
    after(async () => {
      try {
        await task();
      } catch (err) {
        // eslint-disable-next-line no-console -- log non bloquant post-réponse
        console.error(
          "[after-response] tâche échouée :",
          err instanceof Error ? err.message : String(err),
        );
      }
    });
  } catch {
    // Hors contexte server (tests, scripts) : fallback fire-and-forget
    void task().catch((err) => {
      // eslint-disable-next-line no-console
      console.error(
        "[after-response:fallback] tâche échouée :",
        err instanceof Error ? err.message : String(err),
      );
    });
  }
}
