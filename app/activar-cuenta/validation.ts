import "server-only";

import {
  getSupabaseAdminClient,
  normalizeEmail,
  normalizeInvitationCode,
} from "@/utils/invitations";

export type InvitationValidationResult = {
  valid: boolean;
};

type InvitationValidationRow = {
  email: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
};

export async function validateActivationInvitation(
  rawCode?: string,
  rawEmail?: string,
): Promise<InvitationValidationResult> {
  const code = normalizeInvitationCode(rawCode ?? "");
  const email = normalizeEmail(rawEmail ?? "");

  if (!code || !email) {
    return { valid: false };
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("invitations")
      .select("email, status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (error || !data) {
      return { valid: false };
    }

    const invitation = data as InvitationValidationRow;

    if (normalizeEmail(invitation.email) !== email) {
      return { valid: false };
    }

    if (invitation.status !== "pending") {
      return { valid: false };
    }

    const expiresAt = new Date(invitation.expires_at);
    if (!(expiresAt.getTime() > Date.now())) {
      return { valid: false };
    }

    return { valid: true };
  } catch {
    return { valid: false };
  }
}
