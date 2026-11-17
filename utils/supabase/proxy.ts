import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export type AppUserRole = "admin" | "staff" | "parent";

export function getRoleLandingPath(role: AppUserRole): string {
  return role === "parent" ? "/family" : "/staff";
}

function getClaimUserId(claims: Record<string, unknown> | null): string | null {
  if (!claims) return null;
  const sub = claims.sub;
  return typeof sub === "string" ? sub : null;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );

        Object.entries(headers ?? {}).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = (data?.claims as Record<string, unknown> | undefined) ?? null;

  let role: AppUserRole | null = null;
  const userId = getClaimUserId(user);
  if (userId) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const profileRole = profile?.role;
    if (
      profileRole === "admin" ||
      profileRole === "staff" ||
      profileRole === "parent"
    ) {
      role = profileRole;
    }
  }

  const redirect = (url: string | URL) => {
    const redirectResponse = NextResponse.redirect(
      typeof url === "string" ? new URL(url, request.url) : url,
    );

    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    ["cache-control", "expires", "pragma"].forEach((header) => {
      const value = supabaseResponse.headers.get(header);
      if (value) {
        redirectResponse.headers.set(header, value);
      }
    });

    return redirectResponse;
  };

  return { supabase, response: supabaseResponse, user, role, redirect };
}
