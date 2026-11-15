import { Suspense } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getCurrentUserProfile } from "@/utils/supabase/get-current-user-profile";
import { FeedShell } from "./components/feed/FeedShell";
import { feedPageData } from "./components/feed/feed-data";

async function TodosSection() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  if (!todos || todos.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[760px] px-5 pb-10 sm:px-8 lg:px-10">
      <h2 className="mb-3 text-lg font-semibold">Todos</h2>
      <ul className="list-disc pl-5">
        {todos.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </section>
  );
}

async function HomeContent() {
  await connection();
  const currentUser = await getCurrentUserProfile();

  return (
    <>
      <FeedShell data={feedPageData} user={currentUser ?? undefined} />
      <TodosSection />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

