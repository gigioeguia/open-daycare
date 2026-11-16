"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  generateUniqueInvitationCode,
  getInvitationExpiresAt,
  getSupabaseAdminClient,
  normalizeEmail,
  sendInvitationEmail,
} from "@/utils/invitations";

type Relationship = "mother" | "father" | "guardian";

export type SendParentInvitationResult =
  | {
      ok: true;
      email: string;
      code: string;
      reissued: boolean;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: {
        fullName?: string;
        email?: string;
        relationship?: string;
      };
    };

const GENERIC_ERROR_MESSAGE =
  "No se pudo enviar la invitación. Inténtalo de nuevo más tarde.";
const ALREADY_LINKED_MESSAGE = "Este padre ya está vinculado a este niño.";
const INVALID_INPUT_MESSAGE = "Revisa los datos del formulario.";
const UNAUTHORIZED_MESSAGE = "No tienes permiso para realizar esta acción.";

const NAME_PATTERN = /^[\p{L} ]+$/u;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidRelationship(value: string): value is Relationship {
  return value === "mother" || value === "father" || value === "guardian";
}

function validateInput(input: {
  fullName: string;
  email: string;
  relationship: string;
}) {
  const fieldErrors: NonNullable<
    Extract<SendParentInvitationResult, { ok: false }>["fieldErrors"]
  > = {};

  if (!input.fullName) {
    fieldErrors.fullName = "Ingresá el nombre del padre/madre.";
  } else if (!NAME_PATTERN.test(input.fullName)) {
    fieldErrors.fullName = "Solo se permiten letras y espacios.";
  }

  if (!input.email) {
    fieldErrors.email = "Ingresá el email.";
  } else if (!EMAIL_PATTERN.test(input.email)) {
    fieldErrors.email = "Ingresá un email válido.";
  }

  if (!isValidRelationship(input.relationship)) {
    fieldErrors.relationship = "Seleccioná un parentesco.";
  }

  return fieldErrors;
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function sendParentInvitation(input: {
  childId: string;
  fullName: string;
  email: string;
  relationship: string;
}): Promise<SendParentInvitationResult> {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return { ok: false, message: UNAUTHORIZED_MESSAGE };
    }

    const fullName = input.fullName.trim();
    const email = normalizeEmail(input.email);
    const relationship = input.relationship;

    const fieldErrors = validateInput({ fullName, email, relationship });
    if (Object.keys(fieldErrors).length > 0) {
      return { ok: false, message: INVALID_INPUT_MESSAGE, fieldErrors };
    }

    const { data: child, error: childError } = await supabase
      .from("children")
      .select(
        "id, full_name, room:rooms(name, daycare:daycares(name))",
      )
      .eq("id", input.childId)
      .maybeSingle();

    if (childError || !child) {
      return { ok: false, message: "No se encontró el niño indicado." };
    }

    const roomRelation = getSingleRelation(
      child.room as { name: string; daycare: { name: string } | { name: string }[] | null } | { name: string; daycare: { name: string } | { name: string }[] | null }[] | null,
    );
    const daycareRelation = getSingleRelation(roomRelation?.daycare ?? null);
    const childName = child.full_name as string;
    const roomName = roomRelation?.name ?? null;
    const daycareName = daycareRelation?.name ?? null;
    const daycareOrRoomLabel = roomName && daycareName
      ? `${roomName} · ${daycareName}`
      : roomName ?? daycareName;

    const admin = getSupabaseAdminClient();

    // Detect existing account by email (best effort) and existing link to this child
    const { data: usersList, error: usersListError } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersListError) {
      return { ok: false, message: GENERIC_ERROR_MESSAGE };
    }
    const existingAuthUser = usersList.users.find(
      (u) => normalizeEmail(u.email ?? "") === email,
    );

    if (existingAuthUser) {
      const { data: existingLink, error: existingLinkError } = await supabase
        .from("parent_children")
        .select("id")
        .eq("child_id", input.childId)
        .eq("parent_id", existingAuthUser.id)
        .maybeSingle();

      if (existingLinkError) {
        return { ok: false, message: GENERIC_ERROR_MESSAGE };
      }
      if (existingLink) {
        return { ok: false, message: ALREADY_LINKED_MESSAGE };
      }
    }

    const nowIso = new Date().toISOString();
    const { data: pendingInvitations, error: pendingError } = await supabase
      .from("invitations")
      .select("id, email, expires_at")
      .eq("child_id", input.childId)
      .eq("status", "pending")
      .gt("expires_at", nowIso);

    if (pendingError) {
      return { ok: false, message: GENERIC_ERROR_MESSAGE };
    }

    const pendingMatch = (pendingInvitations ?? []).find(
      (inv) => normalizeEmail(inv.email as string) === email,
    );

    let code: string;
    try {
      code = await generateUniqueInvitationCode(supabase);
    } catch {
      return { ok: false, message: GENERIC_ERROR_MESSAGE };
    }

    const expiresAt = getInvitationExpiresAt();
    let reissued = false;

    if (pendingMatch) {
      const { error: updateError } = await supabase
        .from("invitations")
        .update({
          full_name: fullName,
          email,
          relationship: relationship as Relationship,
          code,
          status: "pending",
          expires_at: expiresAt,
          accepted_at: null,
          invited_by: authUser.id,
        })
        .eq("id", pendingMatch.id);

      if (updateError) {
        return { ok: false, message: GENERIC_ERROR_MESSAGE };
      }
      reissued = true;
    } else {
      const { error: insertError } = await supabase.from("invitations").insert({
        child_id: input.childId,
        invited_by: authUser.id,
        full_name: fullName,
        email,
        relationship: relationship as Relationship,
        code,
        status: "pending",
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        return { ok: false, message: GENERIC_ERROR_MESSAGE };
      }
    }

    try {
      await sendInvitationEmail({
        toEmail: email,
        recipientName: fullName,
        childName,
        daycareOrRoomLabel,
        code,
      });
    } catch {
      return {
        ok: false,
        message:
          "La invitación se guardó, pero no se pudo enviar el correo. Inténtalo de nuevo más tarde.",
      };
    }

    return { ok: true, email, code, reissued };
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }
}
