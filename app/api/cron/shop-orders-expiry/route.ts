import { NextRequest, NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/api/cron-auth";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Expire les commandes boutique non payées après 6 h et libère le stock. */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("expire_shop_orders");

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expired: data ?? 0 });
}
