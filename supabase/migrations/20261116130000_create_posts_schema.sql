-- Posts domain: enum, tables, indexes, and constraints for staff/admin publications
-- Source of truth: @db-schema/opendaycare-database-schema.md (sections 7-9, post_type enum)
-- SPEC 15 extensions: post_type includes 'mood'; posts.daycare_id for multi-tenant isolation;
-- post_photos.storage_path (private Storage object path) instead of public url.

-- post_type enum (includes mood per SPEC 15)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_type') THEN
    CREATE TYPE public.post_type AS ENUM (
      'meal',
      'nap',
      'activity',
      'achievement',
      'mood',
      'photo',
      'announcement'
    );
  END IF;
END
$$;

ALTER TYPE public.post_type ADD VALUE IF NOT EXISTS 'mood';

-- 7. posts
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES public.daycares(id),
  author_id uuid NOT NULL REFERENCES public.users(id),
  room_id uuid NOT NULL REFERENCES public.rooms(id),
  type public.post_type NOT NULL,
  title text,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. post_children (tagged children; empty for whole-room posts)
CREATE TABLE IF NOT EXISTS public.post_children (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, child_id)
);

-- 9. post_photos (private storage objects; signed URLs generated in app)
CREATE TABLE IF NOT EXISTS public.post_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  position integer NOT NULL,
  width integer,
  height integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT post_photos_mime_type_check CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  CONSTRAINT post_photos_size_bytes_check CHECK (size_bytes > 0),
  CONSTRAINT post_photos_position_check CHECK (position >= 0)
);

-- Indexes for feed queries, visibility checks, and joins
CREATE INDEX IF NOT EXISTS posts_daycare_room_published_at_idx
  ON public.posts (daycare_id, room_id, published_at DESC);

CREATE INDEX IF NOT EXISTS posts_daycare_published_at_idx
  ON public.posts (daycare_id, published_at DESC);

CREATE INDEX IF NOT EXISTS posts_author_id_idx
  ON public.posts (author_id);

CREATE INDEX IF NOT EXISTS post_children_child_id_idx
  ON public.post_children (child_id);

CREATE INDEX IF NOT EXISTS post_photos_post_id_position_idx
  ON public.post_photos (post_id, position);
