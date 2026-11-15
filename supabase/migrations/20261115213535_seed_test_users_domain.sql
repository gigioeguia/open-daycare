-- Seed test domain data for SPEC 08 (admin/staff test users)
-- Stable IDs for cross-referencing in Auth user metadata (raw_user_meta_data.daycare_id)
-- Idempotent inserts by fixed primary keys.

-- Test daycare
INSERT INTO public.daycares (id, name, created_at)
VALUES (
  '00000000-0000-4000-8000-000000000101',
  'Guardería OpenDayCare (Pruebas)',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name;

-- Test room (same daycare)
INSERT INTO public.rooms (id, daycare_id, name, created_at)
VALUES (
  '00000000-0000-4000-8000-000000000102',
  '00000000-0000-4000-8000-000000000101',
  'Sala Pruebas',
  now()
)
ON CONFLICT (id) DO UPDATE SET
  daycare_id = EXCLUDED.daycare_id,
  name = EXCLUDED.name;

-- Test child (same room/daycare)
INSERT INTO public.children (
  id,
  room_id,
  full_name,
  birth_date,
  enrolled_at,
  medical_notes,
  allergy_tags,
  photo_consent,
  status,
  created_at,
  updated_at
)
VALUES (
  '00000000-0000-4000-8000-000000000103',
  '00000000-0000-4000-8000-000000000102',
  'Niño/a Pruebas',
  DATE '2023-05-10',
  DATE '2025-01-15',
  NULL,
  NULL,
  true,
  'active',
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  room_id = EXCLUDED.room_id,
  full_name = EXCLUDED.full_name,
  birth_date = EXCLUDED.birth_date,
  enrolled_at = EXCLUDED.enrolled_at,
  photo_consent = EXCLUDED.photo_consent,
  status = EXCLUDED.status,
  updated_at = now();
