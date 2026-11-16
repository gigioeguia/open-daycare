import { randomInt } from "node:crypto";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const INVITATION_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const INVITATION_CODE_LENGTH = 5;
const INVITATION_EXPIRES_DAYS = 7;
const MAX_CODE_GENERATION_ATTEMPTS = 10;

export type InvitationRelationship = "mother" | "father" | "guardian";

export type InvitationEmailContext = {
  recipientName: string;
  childName: string;
  daycareOrRoomLabel?: string | null;
  code: string;
  activationUrl: string;
  expiresInDays?: number;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizeInvitationCode(code: string): string {
  return code.trim().toUpperCase();
}

export function generateInvitationCode(): string {
  let code = "";
  for (let index = 0; index < INVITATION_CODE_LENGTH; index += 1) {
    code += INVITATION_CODE_CHARACTERS[randomInt(INVITATION_CODE_CHARACTERS.length)];
  }
  return code;
}

export async function generateUniqueInvitationCode(
  supabase: SupabaseClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_CODE_GENERATION_ATTEMPTS; attempt += 1) {
    const code = generateInvitationCode();
    const { data, error } = await supabase
      .from("invitations")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw new Error("Failed to verify invitation code uniqueness.");
    }

    if (!data) {
      return code;
    }
  }

  throw new Error("Failed to generate a unique invitation code.");
}

export function getInvitationExpiresAt(from: Date = new Date()): string {
  const expiresAt = new Date(from);
  expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRES_DAYS);
  return expiresAt.toISOString();
}

export function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const fromEmail = process.env.INVITATION_FROM_EMAIL?.trim();
  const fromName = process.env.INVITATION_FROM_NAME?.trim() || "OpenDayCare";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }
  if (!fromEmail) {
    throw new Error("Missing INVITATION_FROM_EMAIL environment variable.");
  }

  return { apiKey, fromEmail, fromName, from: `${fromName} <${fromEmail}>` };
}

export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL environment variable.");
  }
  return siteUrl.replace(/\/+$/, "");
}

export function buildActivationUrl(code: string, email: string): string {
  const baseUrl = getSiteUrl();
  const url = new URL("/activar-cuenta", baseUrl);
  url.searchParams.set("code", normalizeInvitationCode(code));
  url.searchParams.set("email", normalizeEmail(email));
  return url.toString();
}

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function composeInvitationEmail(context: InvitationEmailContext): {
  subject: string;
  html: string;
  text: string;
} {
  const expiresInDays = context.expiresInDays ?? INVITATION_EXPIRES_DAYS;
  const locationLabel = context.daycareOrRoomLabel?.trim();
  const subject = `Invitación para seguir a ${context.childName} en OpenDayCare`;

  const locationLine = locationLabel ? ` (${locationLabel})` : "";
  const intro = `Hola ${context.recipientName}, te invitaron a seguir el día de ${context.childName}${locationLine} en OpenDayCare.`;
  const instruction =
    "Usá este código de verificación para activar tu cuenta y vincularte:";
  const codeLabel = "Código de verificación:";
  const expiryText = `Este código vence en ${expiresInDays} días.`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #3F362E;">
      <h2 style="margin: 0 0 12px;">Invitación a OpenDayCare</h2>
      <p style="margin: 0 0 12px;">${escapeHtml(intro)}</p>
      <p style="margin: 0 0 8px;">${escapeHtml(instruction)}</p>
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: #6E6359;">${escapeHtml(codeLabel)}</p>
      <p style="margin: 0 0 12px; font-size: 24px; font-weight: 700; letter-spacing: 4px;">${escapeHtml(context.code)}</p>
      <p style="margin: 0 0 12px;">${escapeHtml(expiryText)}</p>
      <p style="margin: 0 0 16px;">
        <a href="${escapeAttribute(context.activationUrl)}" style="display: inline-block; background: #3F362E; color: #FFFFFF; text-decoration: none; padding: 12px 16px; border-radius: 10px; font-weight: 700;">
          Activar mi cuenta
        </a>
      </p>
      <p style="margin: 0; font-size: 13px; color: #6E6359;">
        Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br />
        <a href="${escapeAttribute(context.activationUrl)}">${escapeHtml(context.activationUrl)}</a>
      </p>
    </div>
  `.trim();

  const text = [
    "Invitación a OpenDayCare",
    "",
    intro,
    "",
    instruction,
    codeLabel,
    context.code,
    "",
    expiryText,
    `Activar cuenta: ${context.activationUrl}`,
  ].join("\n");

  return { subject, html, text };
}

export async function sendInvitationEmail(params: {
  toEmail: string;
  recipientName: string;
  childName: string;
  daycareOrRoomLabel?: string | null;
  code: string;
}): Promise<void> {
  const resendConfig = getResendConfig();
  const resend = new Resend(resendConfig.apiKey);
  const activationUrl = buildActivationUrl(params.code, params.toEmail);
  const message = composeInvitationEmail({
    recipientName: params.recipientName,
    childName: params.childName,
    daycareOrRoomLabel: params.daycareOrRoomLabel,
    code: params.code,
    activationUrl,
  });

  const { error } = await resend.emails.send({
    from: resendConfig.from,
    to: params.toEmail,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send invitation email.");
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value);
}
