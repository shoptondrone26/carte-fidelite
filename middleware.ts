import { type NextRequest, NextResponse } from "next/server";

import { getIsAdmin } from "@/lib/auth/roles";
import { createSupabaseMiddlewareClient } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createSupabaseMiddlewareClient(request);

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const path = request.nextUrl.pathname;

  if (path === "/offline") {
    return response;
  }

  const needsRoleCheck =
    path.startsWith("/dashboard") ||
    path.startsWith("/admin") ||
    path === "/login" ||
    path === "/signup";

  const isAdmin =
    user && needsRoleCheck ? await getIsAdmin(supabase, user.id) : false;

  if (
    process.env.DEBUG_ADMIN_ROLE === "1" &&
    user &&
    (path.startsWith("/admin") || path.startsWith("/dashboard"))
  ) {
    // eslint-disable-next-line no-console -- debug opt-in only
    console.log("[middleware role]", { path, userId: user.id, isAdmin });
  }

  function redirectWithSession(redirectResponse: NextResponse) {
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  function dashboardNextParam() {
    return request.nextUrl.searchParams.get("pushDebug") === "1"
      ? "/dashboard?pushDebug=1"
      : "/dashboard";
  }

  if (path.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", dashboardNextParam());
      return redirectWithSession(NextResponse.redirect(url));
    }
    if (isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return redirectWithSession(NextResponse.redirect(url));
    }
  }

  if (path.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", "/admin");
      return redirectWithSession(NextResponse.redirect(url));
    }
    if (!isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return redirectWithSession(NextResponse.redirect(url));
    }
  }

  if (path === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/dashboard";
    const keepPushDebug =
      !isAdmin && request.nextUrl.searchParams.get("pushDebug") === "1";
    url.search = keepPushDebug ? "?pushDebug=1" : "";
    return redirectWithSession(NextResponse.redirect(url));
  }

  if (path === "/signup" && user) {
    const url = request.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/dashboard";
    url.search = "";
    return redirectWithSession(NextResponse.redirect(url));
  }

  if (path.startsWith("/deblocage") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", "/deblocage");
    return redirectWithSession(NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: [
    /* api/cron + webhooks : pas de session rôle, évite tout effet de bord */
    "/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
