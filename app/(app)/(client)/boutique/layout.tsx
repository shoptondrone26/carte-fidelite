import type { ReactNode } from "react";

import { BoutiqueClientShell } from "@/components/client/boutique/boutique-client-shell";
import { BoutiqueSectionShell } from "@/components/client/boutique/boutique-section-shell";
import { requireClient } from "@/lib/client/require-client";

export default async function BoutiqueLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireClient("/boutique");

  return (
    <BoutiqueClientShell>
      <BoutiqueSectionShell>{children}</BoutiqueSectionShell>
    </BoutiqueClientShell>
  );
}
