-- Invitations: enum and table for parent-child linking flow
-- Source of truth: docs/opendaycare-database-schema.md (enums, section 6)
-- Scope: DDL literal to reference + spec 12 (no RLS, no triggers, no seeds)

CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES public.children(id),
  invited_by uuid NOT NULL REFERENCES public.users(id),
  full_name text NOT NULL,
  email text NOT NULL,
  relationship public.relationship_type NOT NULL,
  code text NOT NULL UNIQUE,
  status public.invitation_status NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz
);
