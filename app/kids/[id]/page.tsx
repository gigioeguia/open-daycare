import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUserContext } from "@/utils/supabase/get-current-user-context";

type KidProfilePageProps = {
  params: Promise<{ id: string }>;
};

async function LegacyKidRedirect({
  params,
}: KidProfilePageProps): Promise<null> {
  await connection();
  const { id } = await params;
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "parent") {
    redirect(`/staff/kids/${id}`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: link } = await supabase
    .from("parent_children")
    .select("id")
    .eq("parent_id", context.userId)
    .eq("child_id", id)
    .maybeSingle();

  if (!link) {
    redirect("/family");
  }

  redirect("/family");
}

export default function KidProfilePage(props: KidProfilePageProps) {
  return (
    <Suspense fallback={null}>
      <LegacyKidRedirect {...props} />
    </Suspense>
  );
}
