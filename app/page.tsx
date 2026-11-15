import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
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

export default function Home() {
  return (
    <>
      <FeedShell data={feedPageData} />
      <Suspense fallback={null}>
        <TodosSection />
      </Suspense>
    </>
  );
}

