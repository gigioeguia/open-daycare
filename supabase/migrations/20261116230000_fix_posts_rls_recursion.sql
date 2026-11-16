-- Fix RLS recursion between posts/post_children/post_photos (SPEC 15)

CREATE OR REPLACE FUNCTION public.can_manage_post(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid()
    WHERE p.id = p_post_id
      AND u.role IN ('staff', 'admin')
      AND u.daycare_id = p.daycare_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_post(p_post_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.posts p
    JOIN public.users u ON u.id = auth.uid() AND u.daycare_id = p.daycare_id
    WHERE p.id = p_post_id
      AND (
        u.role IN ('staff', 'admin')
        OR (
          u.role = 'parent'
          AND (
            EXISTS (
              SELECT 1
              FROM public.post_children pc
              JOIN public.parent_children pac ON pac.child_id = pc.child_id
              WHERE pc.post_id = p.id
                AND pac.parent_id = auth.uid()
            )
            OR (
              p.type = 'announcement'
              AND EXISTS (
                SELECT 1
                FROM public.parent_children pac
                JOIN public.children c ON c.id = pac.child_id
                WHERE pac.parent_id = auth.uid()
                  AND c.room_id = p.room_id
              )
            )
          )
        )
      )
  );
$$;

DROP POLICY IF EXISTS posts_select_staff_admin ON public.posts;
DROP POLICY IF EXISTS posts_select_parent ON public.posts;
DROP POLICY IF EXISTS posts_insert_staff_admin ON public.posts;
DROP POLICY IF EXISTS posts_update_staff_admin ON public.posts;
DROP POLICY IF EXISTS posts_delete_staff_admin ON public.posts;

CREATE POLICY posts_select_staff_admin ON public.posts FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin') AND u.daycare_id = posts.daycare_id));

CREATE POLICY posts_select_parent ON public.posts FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'parent' AND u.daycare_id = posts.daycare_id)
  AND (
    EXISTS (SELECT 1 FROM public.post_children pc JOIN public.parent_children pac ON pac.child_id = pc.child_id WHERE pc.post_id = posts.id AND pac.parent_id = auth.uid())
    OR (posts.type = 'announcement' AND EXISTS (SELECT 1 FROM public.parent_children pac JOIN public.children c ON c.id = pac.child_id WHERE pac.parent_id = auth.uid() AND c.room_id = posts.room_id))
  )
);

CREATE POLICY posts_insert_staff_admin ON public.posts FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.users u JOIN public.rooms r ON r.id = posts.room_id WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin') AND u.daycare_id = posts.daycare_id AND r.daycare_id = posts.daycare_id));

CREATE POLICY posts_update_staff_admin ON public.posts FOR UPDATE TO authenticated
USING (public.can_manage_post(posts.id))
WITH CHECK (author_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('staff','admin') AND u.daycare_id = posts.daycare_id));

CREATE POLICY posts_delete_staff_admin ON public.posts FOR DELETE TO authenticated
USING (public.can_manage_post(posts.id));

DROP POLICY IF EXISTS post_children_select_visible_post ON public.post_children;
DROP POLICY IF EXISTS post_children_insert_staff_admin ON public.post_children;
DROP POLICY IF EXISTS post_children_update_staff_admin ON public.post_children;
DROP POLICY IF EXISTS post_children_delete_staff_admin ON public.post_children;

CREATE POLICY post_children_select_visible_post ON public.post_children FOR SELECT TO authenticated
USING (public.can_view_post(post_children.post_id));

CREATE POLICY post_children_insert_staff_admin ON public.post_children FOR INSERT TO authenticated
WITH CHECK (
  public.can_manage_post(post_children.post_id)
  AND EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.children c ON c.id = post_children.child_id
    JOIN public.rooms cr ON cr.id = c.room_id
    WHERE p.id = post_children.post_id AND cr.daycare_id = p.daycare_id
  )
);

CREATE POLICY post_children_update_staff_admin ON public.post_children FOR UPDATE TO authenticated
USING (public.can_manage_post(post_children.post_id))
WITH CHECK (
  public.can_manage_post(post_children.post_id)
  AND EXISTS (
    SELECT 1 FROM public.posts p
    JOIN public.children c ON c.id = post_children.child_id
    JOIN public.rooms cr ON cr.id = c.room_id
    WHERE p.id = post_children.post_id AND cr.daycare_id = p.daycare_id
  )
);

CREATE POLICY post_children_delete_staff_admin ON public.post_children FOR DELETE TO authenticated
USING (public.can_manage_post(post_children.post_id));

DROP POLICY IF EXISTS post_photos_select_visible_post ON public.post_photos;
DROP POLICY IF EXISTS post_photos_insert_staff_admin ON public.post_photos;
DROP POLICY IF EXISTS post_photos_update_staff_admin ON public.post_photos;
DROP POLICY IF EXISTS post_photos_delete_staff_admin ON public.post_photos;

CREATE POLICY post_photos_select_visible_post ON public.post_photos FOR SELECT TO authenticated
USING (public.can_view_post(post_photos.post_id));

CREATE POLICY post_photos_insert_staff_admin ON public.post_photos FOR INSERT TO authenticated
WITH CHECK (public.can_manage_post(post_photos.post_id));

CREATE POLICY post_photos_update_staff_admin ON public.post_photos FOR UPDATE TO authenticated
USING (public.can_manage_post(post_photos.post_id))
WITH CHECK (public.can_manage_post(post_photos.post_id));

CREATE POLICY post_photos_delete_staff_admin ON public.post_photos FOR DELETE TO authenticated
USING (public.can_manage_post(post_photos.post_id));

REVOKE ALL ON FUNCTION public.can_manage_post(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_view_post(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_post(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid) TO authenticated;
