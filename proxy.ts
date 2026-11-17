import type { NextRequest } from "next/server";
import { getRoleLandingPath, updateSession } from "@/utils/supabase/proxy";

const PUBLIC_AUTH_PATHS = ["/login", "/activar-cuenta"];

function isPublicAuthPath(pathname: string): boolean {
  return PUBLIC_AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function getRoleAreaRedirect(
  pathname: string,
  role: "admin" | "staff" | "parent",
): string | null {
  if (pathname === "/" || pathname === "/kids") {
    if (role === "parent") return "/family";
    if (pathname === "/kids") return "/staff/kids";
    return "/staff";
  }

  if (pathname.startsWith("/staff")) {
    return role === "parent" ? "/family" : null;
  }

  if (pathname.startsWith("/family")) {
    return role === "parent" ? null : "/staff";
  }

  return null;
}

export async function proxy(request: NextRequest) {
  const { user, role, response, redirect } = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const isAuthPath = isPublicAuthPath(pathname);

  if (!user && !isAuthPath) {
    return redirect("/login");
  }

  if (user && isAuthPath) {
    return redirect(role ? getRoleLandingPath(role) : "/staff");
  }

  if (user && role) {
    const target = getRoleAreaRedirect(pathname, role);
    if (target && target !== pathname) {
      return redirect(target);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
