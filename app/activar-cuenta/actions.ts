"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getSupabaseAdminClient,
  normalizeEmail,
  normalizeInvitationCode,
} from "@/utils/invitations";

export type ActivateAccountState = {
  error?: string;
  fieldErrors?: {
    code?: string;
    email?: string;
    password?: string;
    consent?: string;
  };
};

const GENERIC_ERROR_MESSAGE =
  "No se pudo activar la cuenta. Inténtalo de nuevo más tarde.";
const ACCOUNT_EXISTS_MESSAGE =
  "Este correo ya tiene una cuenta. Iniciá sesión para vincularte.";
const ALREADY_LINKED_MESSAGE = "Este padre ya está vinculado a este niño.";

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type InvitationRow = {
  id: string;
  child_id: string;
  full_name: string;
  email: string;
  relationship: "mother" | "father" | "guardian";
  code: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  child:
    | {
        id: string;
        room:
          | { daycare_id: string }
          | { daycare_id: string }[]
          | null;
      }
    | {
        id: string;
        room:
          | { daycare_id: string }
          | { daycare_id: string }[]
          | null;
      }[]
    | null;
};

export async function activateAccount(
  _previousState: ActivateAccountState,
  formData: FormData,
): Promise<ActivateAccountState> {
  try {
    const rawCode = String(formData.get("invitationCode") ?? "");
    const rawEmail = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const consent = formData.get("consent") === "on";

    const code = normalizeInvitationCode(rawCode);
    const email = normalizeEmail(rawEmail);

    const fieldErrors: ActivateAccountState["fieldErrors"] = {};
    if (!code) fieldErrors.code = "Ingresá el código de invitación.";
    if (!email) fieldErrors.email = "Ingresá tu email.";
    if (!password) fieldErrors.password = "Ingresá una contraseña.";
    if (!consent) fieldErrors.consent = "Debes aceptar el consentimiento para continuar.";

    if (Object.keys(fieldErrors).length > 0) {
      return { fieldErrors, error: "Revisa los datos del formulario." };
    }

    const admin = getSupabaseAdminClient();

    const { data: invitationData, error: invitationError } = await admin
      .from("invitations")
      .select(
        "id, child_id, full_name, email, relationship, code, status, expires_at, child:children(id, room:rooms(daycare_id))",
      )
      .eq("code", code)
      .maybeSingle();

    if (invitationError || !invitationData) {
      return { error: "El código de invitación no es válido." };
    }

    const invitation = invitationData as InvitationRow;

    if (normalizeEmail(invitation.email) !== email) {
      return { error: "El email no coincide con la invitación." };
    }

    if (invitation.status !== "pending") {
      if (invitation.status === "accepted") {
        return { error: "Esta invitación ya fue utilizada." };
      }
      if (invitation.status === "expired" || invitation.status === "cancelled") {
        return { error: "Esta invitación ya no es válida." };
      }
      return { error: "La invitación no es válida." };
    }

    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    if (!(expiresAt.getTime() > now.getTime())) {
      return { error: "Esta invitación ha expirado." };
    }

    // Check if email already has an account
    const { data: usersList, error: usersListError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersListError) {
      return { error: GENERIC_ERROR_MESSAGE };
    }
    const existingAuthUser = usersList.users.find(
      (u) => normalizeEmail(u.email ?? "") === email,
    );

    if (existingAuthUser) {
      const { data: existingLink, error: existingLinkError } = await admin
        .from("parent_children")
        .select("id")
        .eq("child_id", invitation.child_id)
        .eq("parent_id", existingAuthUser.id)
        .maybeSingle();

      if (existingLinkError) {
        return { error: GENERIC_ERROR_MESSAGE };
      }
      if (existingLink) {
        return { error: ALREADY_LINKED_MESSAGE };
      }
      return { error: ACCOUNT_EXISTS_MESSAGE };
    }

    const childRelation = getSingleRelation(invitation.child);
    const roomRelation = getSingleRelation(childRelation?.room ?? null);
    const daycareId = roomRelation?.daycare_id;

    if (!daycareId) {
      return { error: GENERIC_ERROR_MESSAGE };
    }

    const { data: createdUserData, error: createUserError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          daycare_id: daycareId,
          role: "parent",
          full_name: invitation.full_name,
        },
      });

    if (createUserError || !createdUserData.user) {
      const msg = (createUserError?.message ?? "").toLowerCase();
      if (msg.includes("already") || msg.includes("registered") || msg.includes("exists")) {
        return { error: ACCOUNT_EXISTS_MESSAGE };
      }
      if (msg.includes("password")) {
        return { fieldErrors: { password: "La contraseña no cumple los requisitos." }, error: "Revisa los datos del formulario." };
      }
      return { error: GENERIC_ERROR_MESSAGE };
    }

    const newUserId = createdUserData.user.id;

    const { error: linkError } = await admin.from("parent_children").insert({
      parent_id: newUserId,
      child_id: invitation.child_id,
      relationship: invitation.relationship,
      created_at: new Date().toISOString(),
    });

    if (linkError) {
      // If unique conflict, treat as already linked
      if ((linkError as { code?: string }).code === "23505") {
        return { error: ALREADY_LINKED_MESSAGE };
      }
      return { error: GENERIC_ERROR_MESSAGE };
    }

    const { error: acceptError } = await admin
      .from("invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id)
      .eq("status", "pending");

    if (acceptError) {
      return { error: GENERIC_ERROR_MESSAGE };
    }

    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Account created and linked; ask to login
      return {
        error:
          "La cuenta fue activada, pero no se pudo iniciar sesión automáticamente. Iniciá sesión.",
      };
    }
  } catch {
    return { error: GENERIC_ERROR_MESSAGE };
  }

  redirect("/");
}
