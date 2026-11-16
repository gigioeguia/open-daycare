-- Private Storage bucket and policies for post images (SPEC 15)
-- Path convention: <daycare_id>/<post_id>/<filename>

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Staff/admin of the daycare (path segment 1) can manage objects for upload/delete flows.
CREATE POLICY post_images_insert_staff_admin
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY post_images_update_staff_admin
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'post-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY post_images_delete_staff_admin
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images'
  AND EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id::text = (storage.foldername(name))[1]
  )
);

-- Read access: staff/admin of the daycare, or any authenticated user who can see
-- a post_photo/post associated with this exact storage_path (parents via RLS visibility).
CREATE POLICY post_images_select_authorized
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-images'
  AND (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('staff', 'admin')
        AND u.daycare_id::text = (storage.foldername(name))[1]
    )
    OR EXISTS (
      SELECT 1
      FROM public.post_photos pp
      JOIN public.posts p ON p.id = pp.post_id
      WHERE pp.storage_path = name
    )
  )
);
