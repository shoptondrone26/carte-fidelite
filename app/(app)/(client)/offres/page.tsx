export default function OffresPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">
        Membres uniquement
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
        Privilèges
      </h1>
      <p className="mt-3 text-muted-foreground">
        Des avantages sélectionnés pour prolonger l’expérience privée.
      </p>
    </main>
  );
}
