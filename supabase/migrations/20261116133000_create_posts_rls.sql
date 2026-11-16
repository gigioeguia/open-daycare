-- RLS and policies for posts domain (SPEC 15)
-- Multi-tenant isolation by daycare_id with role-based access:
-- - staff/admin: manage posts in their daycare; read posts in their daycare context
-- - parent: read posts tagging their linked children and room announcements for their children's rooms

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_photos ENABLE ROW LEVEL SECURITY;

-- Helper predicate expressions are inlined for clarity and planner visibility.

-- POSTS: SELECT
CREATE POLICY posts_select_staff_admin
ON public.posts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = posts.daycare_id
  )
);

CREATE POLICY posts_select_parent
ON public.posts
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role = 'parent'
      AND u.daycare_id = posts.daycare_id
  )
  AND (
    EXISTS (
      SELECT 1
      FROM public.post_children pc
      JOIN public.parent_children pac ON pac.child_id = pc.child_id
      WHERE pc.post_id = posts.id
        AND pac.parent_id = auth.uid()
    )
    OR (
      posts.type = 'announcement'
      AND EXISTS (
        SELECT 1
        FROM public.parent_children pac
        JOIN public.children c ON c.id = pac.child_id
        WHERE pac.parent_id = auth.uid()
          AND c.room_id = posts.room_id
      )
    )
  )
);

-- POSTS: INSERT
CREATE POLICY posts_insert_staff_admin
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.rooms r ON r.id = posts.room_id
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = posts.daycare_id
      AND r.daycare_id = posts.daycare_id
  )
);

-- POSTS: UPDATE
CREATE POLICY posts_update_staff_admin
ON public.posts
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = posts.daycare_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.rooms r ON r.id = posts.room_id
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = posts.daycare_id
      AND r.daycare_id = posts.daycare_id
  )
);

-- POSTS: DELETE
CREATE POLICY posts_delete_staff_admin
ON public.posts
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = posts.daycare_id
  )
);

-- POST_CHILDREN: SELECT (visible when parent post is visible)
CREATE POLICY post_children_select_visible_post
ON public.post_children
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_children.post_id
  )
);

-- POST_CHILDREN: INSERT/UPDATE/DELETE by staff/admin managing the post's daycare
CREATE POLICY post_children_insert_staff_admin
ON public.post_children
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    JOIN public.children c ON c.id = post_children.child_id
    JOIN public.rooms cr ON cr.id = c.room_id
    WHERE p.id = post_children.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
      AND cr.daycare_id = p.daycare_id
  )
);

CREATE POLICY post_children_update_staff_admin
ON public.post_children
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = post_children.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    JOIN public.children c ON c.id = post_children.child_id
    JOIN public.rooms cr ON cr.id = c.room_id
    WHERE p.id = post_children.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
      AND cr.daycare_id = p.daycare_id
  )
);

CREATE POLICY post_children_delete_staff_admin
ON public.post_children
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = post_children.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  )
);

-- POST_PHOTOS: SELECT (visible when parent post is visible)
CREATE POLICY post_photos_select_visible_post
ON public.post_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    WHERE p.id = post_photos.post_id
  )
);

-- POST_PHOTOS: INSERT/UPDATE/DELETE by staff/admin managing the post's daycare
CREATE POLICY post_photos_insert_staff_admin
ON public.post_photos
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = post_photos.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  )
);

CREATE POLICY post_photos_update_staff_admin
ON public.post_photos
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = post_photos.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = post_photos.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  )
);

CREATE POLICY post_photos_delete_staff_admin
ON public.post_photos
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = post_photos.post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  )
);
