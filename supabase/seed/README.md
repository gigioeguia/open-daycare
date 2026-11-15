# Test users seed (SPEC 08)

Creates reproducible Supabase Auth identities for testing:
- 1 `admin`: `admin.pruebas@opendaycare.test`
- 2 `staff`: `staff1.pruebas@opendaycare.test`, `staff2.pruebas@opendaycare.test`

All belong to the same test daycare (`daycare_id = 00000000-0000-4000-8000-000000000101`, "Guardería OpenDayCare (Pruebas)") created by the domain migration.

## Prerequisites

- Node.js 18+.
- Domain migration applied: `supabase/migrations/20261115213535_seed_test_users_domain.sql` (test daycare/room/child must exist so `raw_user_meta_data.daycare_id` is valid and trigger can create `public.users`).
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the target environment (**never commit the service role key**).
- Test user variables (`TEST_*`) available (see `,env.template`).

## Usage

```bash
# Using env vars already exported
node supabase/seed/create-test-users.mjs

# Loading variables from a file (e.g. ,env)
node supabase/seed/create-test-users.mjs --env-file ,env
```

Run against **local** Supabase (local URL + local service role key) and against **remote** OpenDaycare (`https://ixhfvteeyzmwspyhupti.supabase.co` + remote service role key) as needed. Ensure the correct `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` pair for each environment.

## Behavior

- Calls Auth Admin API (`POST /auth/v1/admin/users`) with `email_confirm: true` and `user_metadata` containing `daycare_id`, `role`, `full_name`.
- The `handle_new_auth_user` trigger (SPEC 07) creates the corresponding `public.users` profile on insert into `auth.users`.
- Idempotent by email: if a user already exists, it is skipped (no password/metadata update). To recreate, remove the user from Supabase Auth first.

## Verification

- `public.users` has 3 rows for the test `daycare_id` with roles `admin`, `staff`, `staff` and `status = 'active'`.
- Each account can sign in with the credentials documented in `,env` / spec 08.
