/** Hauteur approximative de la bottom nav client (voir app-shell). */
export const CLIENT_BOTTOM_NAV_HEIGHT = "5.25rem";

/** Padding bas des bottom sheets client (nav fixe + home indicator iOS). */
export const clientBottomSheetPanelClass = `pb-[max(1.25rem,calc(${CLIENT_BOTTOM_NAV_HEIGHT}+env(safe-area-inset-bottom)))]`;

/** Hauteur max scrollable d’un sheet au-dessus de la nav et des safe areas. */
export const clientBottomSheetMaxHeightClass =
  "max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5.25rem))]";

/** Panier / sheet plein écran : hauteur utile sous la barre de statut. */
export const clientCartDrawerPanelClass =
  "max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-top)))]";

/** Pied de panier sticky (home indicator + marge confort iPhone). */
export const clientCartDrawerFooterClass =
  "shrink-0 border-t border-white/10 bg-zinc-950/98 px-4 pt-3 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] backdrop-blur-md";
