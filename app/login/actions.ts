"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type LoginState = {
  error?: string;
};

const INVALID_CREDENTIALS_MESSAGE = "Correo o contraseña incorrectos.";
const GENERIC_ERROR_MESSAGE =
  "No se pudo iniciar sesión. Inténtalo de nuevo más tarde.";

export async function signIn(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const message = error.message.toLowerCase();
    const isInvalidCredentials =
      error.status === 400 ||
      message.includes("invalid login credentials") ||
      message.includes("invalid credentials");

    return {
      error: isInvalidCredentials
        ? INVALID_CREDENTIALS_MESSAGE
        : GENERIC_ERROR_MESSAGE,
    };
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/staff");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .maybeSingle();

  redirect(profile?.role === "parent" ? "/family" : "/staff");
}
