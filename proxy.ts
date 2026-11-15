import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

const PUBLIC_AUTH_PATHS = ["/login", "/activar-cuenta"];

export async function proxy(request: NextRequest) {
  const { user, response, redirect } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isPublicAuthPath = PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (!user && !isPublicAuthPath) {
    return redirect("/login");
  }

  if (user && isPublicAuthPath) {
    return redirect("/");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
