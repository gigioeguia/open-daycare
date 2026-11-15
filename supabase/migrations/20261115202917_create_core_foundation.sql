-- Core foundation: enums, core tables, and auth user profile bootstrap
-- Source of truth: docs/opendaycare-database-schema.md (enums, sections 1-5)
-- Scope: DDL literal to doc + handle_new_auth_user trigger (no RLS, no updated_at trigger)

-- ENUMs
CREATE TYPE public.user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE public.user_status AS ENUM ('pending', 'active');
CREATE TYPE public.relationship_type AS ENUM ('father', 'mother', 'guardian');
CREATE TYPE public.child_status AS ENUM ('active', 'archived');

-- 1. daycares
CREATE TABLE public.daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz
);

-- 3. rooms (created before users/children dependencies are not required, but before children FK)
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES public.daycares(id),
  name text NOT NULL,
  created_at timestamptz
);

-- 2. users (profile linked to auth.users)
CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id uuid NOT NULL REFERENCES public.daycares(id),
  role public.user_role NOT NULL,
  status public.user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
);

-- 4. children
CREATE TABLE public.children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES public.rooms(id),
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL,
  medical_notes text,
  allergy_tags text[],
  photo_consent boolean NOT NULL DEFAULT true,
  status public.child_status NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);

-- 5. parent_children
CREATE TABLE public.parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES public.users(id),
  child_id uuid NOT NULL REFERENCES public.children(id),
  relationship public.relationship_type NOT NULL,
  created_at timestamptz,
  UNIQUE (parent_id, child_id)
);

-- Profile bootstrap: create public.users row on auth.users insert
-- Reads daycare_id, role, full_name from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, full_name, status, created_at, updated_at)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data ->> 'daycare_id')::uuid,
    (NEW.raw_user_meta_data ->> 'role')::public.user_role,
    NEW.raw_user_meta_data ->> 'full_name',
    'active',
    now(),
    now()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();
