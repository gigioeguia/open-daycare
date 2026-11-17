import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/utils/supabase/get-current-user-context";

async function HomeRedirect(): Promise<null> {
  await connection();
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  redirect(context.role === "parent" ? "/family" : "/staff");
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeRedirect />
    </Suspense>
  );
}
