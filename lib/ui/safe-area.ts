/** Hauteur approximative de la bottom nav client (voir app-shell). */
export const CLIENT_BOTTOM_NAV_HEIGHT = "5.25rem";

/** Padding bas des bottom sheets client (nav fixe + home indicator iOS). */
export const clientBottomSheetPanelClass = `pb-[max(1.25rem,calc(${CLIENT_BOTTOM_NAV_HEIGHT}+env(safe-area-inset-bottom)))]`;

/** Hauteur max scrollable d’un sheet au-dessus de la nav et des safe areas. */
export const clientBottomSheetMaxHeightClass =
  "max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-5.25rem))]";
