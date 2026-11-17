import { Suspense } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/utils/supabase/get-current-user-context";

async function FamilyLayoutGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const context = await getCurrentUserContext();

  if (!context) {
    redirect("/login");
  }

  if (context.role !== "parent") {
    redirect("/staff");
  }

  return <>{children}</>;
}

export default function FamilyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <FamilyLayoutGuard>{children}</FamilyLayoutGuard>
    </Suspense>
  );
}
