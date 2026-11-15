#!/usr/bin/env node
/**
 * SPEC 08 - Create test Auth identities (admin + 2 staff) in Supabase Auth.
 * Reproducible for local and remote environments.
 *
 * Prerequisites:
 * - Node.js 18+ (uses global fetch)
 * - Domain migration applied (test daycare must exist): 00000000-0000-4000-8000-000000000101
 * - Supabase project URL and SERVICE ROLE key (admin). Never commit the service role key.
 *
 * Required env vars (or provide them via --env-file):
 *   SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
 *   TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_ADMIN_FULL_NAME
 *   TEST_STAFF1_EMAIL, TEST_STAFF1_PASSWORD, TEST_STAFF1_FULL_NAME
 *   TEST_STAFF2_EMAIL, TEST_STAFF2_PASSWORD, TEST_STAFF2_FULL_NAME
 *
 * Usage:
 *   node supabase/seed/create-test-users.mjs
 *   node supabase/seed/create-test-users.mjs --env-file ,env
 *   node supabase/seed/create-test-users.mjs --env-file .env.local
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TEST_DAYCARE_ID = "00000000-0000-4000-8000-000000000101";

function parseEnvFile(filePath) {
  const absolutePath = resolve(process.cwd(), filePath);
  const content = readFileSync(absolutePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getArgValue(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function supabaseAdminRequest(supabaseUrl, serviceRoleKey, path, options = {}) {
  const url = `${supabaseUrl.replace(/\/$/, "")}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { ok: response.ok, status: response.status, data };
}

async function findUserByEmail(supabaseUrl, serviceRoleKey, email) {
  let page = 1;
  const perPage = 50;
  const normalizedEmail = email.toLowerCase();

  while (true) {
    const result = await supabaseAdminRequest(
      supabaseUrl,
      serviceRoleKey,
      `/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      { method: "GET" }
    );

    if (!result.ok) {
      throw new Error(
        `Failed to list users (status ${result.status}): ${JSON.stringify(result.data)}`
      );
    }

    const users = result.data?.users || [];
    const found = users.find((user) => (user.email || "").toLowerCase() === normalizedEmail);
    if (found) return found;
    if (users.length < perPage) return null;
    page += 1;
  }
}

async function ensureAuthUser(supabaseUrl, serviceRoleKey, userDef) {
  const existing = await findUserByEmail(supabaseUrl, serviceRoleKey, userDef.email);
  if (existing) {
    console.log(`SKIP  ${userDef.role.padEnd(5)} ${userDef.email} (already exists, id=${existing.id})`);
    return { status: "skipped", id: existing.id };
  }

  const payload = {
    email: userDef.email,
    password: userDef.password,
    email_confirm: true,
    user_metadata: {
      daycare_id: TEST_DAYCARE_ID,
      role: userDef.role,
      full_name: userDef.fullName,
    },
  };

  const result = await supabaseAdminRequest(supabaseUrl, serviceRoleKey, "/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!result.ok) {
    throw new Error(
      `Failed to create ${userDef.email} (status ${result.status}): ${JSON.stringify(result.data)}`
    );
  }

  const createdId = result.data?.id;
  console.log(`CREATE ${userDef.role.padEnd(5)} ${userDef.email} (id=${createdId})`);
  return { status: "created", id: createdId };
}

async function main() {
  const envFile = getArgValue("--env-file");
  if (envFile) {
    parseEnvFile(envFile);
  }

  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const users = [
    {
      role: "admin",
      email: requireEnv("TEST_ADMIN_EMAIL"),
      password: requireEnv("TEST_ADMIN_PASSWORD"),
      fullName: requireEnv("TEST_ADMIN_FULL_NAME"),
    },
    {
      role: "staff",
      email: requireEnv("TEST_STAFF1_EMAIL"),
      password: requireEnv("TEST_STAFF1_PASSWORD"),
      fullName: requireEnv("TEST_STAFF1_FULL_NAME"),
    },
    {
      role: "staff",
      email: requireEnv("TEST_STAFF2_EMAIL"),
      password: requireEnv("TEST_STAFF2_PASSWORD"),
      fullName: requireEnv("TEST_STAFF2_FULL_NAME"),
    },
  ];

  console.log(`Using test daycare_id: ${TEST_DAYCARE_ID}`);
  console.log(`Target: ${supabaseUrl}`);

  const results = [];
  for (const userDef of users) {
    results.push(await ensureAuthUser(supabaseUrl, serviceRoleKey, userDef));
  }

  const created = results.filter((r) => r.status === "created").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  console.log(`Done. created=${created} skipped=${skipped}`);
  console.log(
    "Note: handle_new_auth_user trigger creates public.users profiles from raw_user_meta_data on auth user creation."
  );
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});
