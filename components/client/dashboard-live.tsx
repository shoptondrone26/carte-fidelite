"use client";

import Link from "next/link";

import { FreeRewardsPanel } from "@/components/dashboard/free-rewards-panel";
import { LoyaltyCard } from "@/components/dashboard/loyalty-card";
import { RecentHistory } from "@/components/dashboard/recent-history";
import { buttonVariants } from "@/components/ui/button";
import { useClientLoyaltyRealtime } from "@/hooks/use-client-loyalty-realtime";
import {
  getFreeAvailable,
  getFreeEarned,
} from "@/lib/loyalty/free-rewards";
import {
  getCycleProgress,
  getVipLevel,
} from "@/lib/loyalty/vip";
import type { ClientLoyaltySnapshot } from "@/lib/realtime/client-loyalty";
import { cn } from "@/lib/utils";

type DashboardLiveProps = {
  userId: string;
  displayName: string;
  initial: ClientLoyaltySnapshot;
};

export function DashboardLive({
  userId,
  displayName,
  initial,
}: DashboardLiveProps) {
  const loyalty = useClientLoyaltyRealtime(userId, initial);
  const totalUnlocks = loyalty.totalUnlocks;
  const vipLevel = getVipLevel(totalUnlocks);
  const cycle = getCycleProgress(totalUnlocks);
  const freeEarned = getFreeEarned(totalUnlocks);
  const freeUsed = loyalty.freeUsedCount;
  const freeAvailable = getFreeAvailable(freeEarned, freeUsed);

  return (
    <>
      <LoyaltyCard
        displayName={displayName}
        vipLevel={vipLevel}
        totalUnlocks={totalUnlocks}
        cycle={cycle}
        freeEarned={freeEarned}
        freeAvailable={freeAvailable}
      />
      <FreeRewardsPanel
        freeAvailable={freeAvailable}
        freeEarned={freeEarned}
        freeUsed={freeUsed}
        freeUsedHistory={loyalty.freeUsedHistory}
      />
      <RecentHistory items={loyalty.historyItems} />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "h-11 w-full justify-center",
        )}
      >
        Retour à l&apos;accueil
      </Link>
    </>
  );
}
