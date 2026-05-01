import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4 max-w-5xl mx-auto">
          <Link href="/dashboard" className="font-bold tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            Topcreator
          </Link>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link href="/dashboard" className="hover:text-blue-500 transition-colors">Overview</Link>
            <Link href="/dashboard/decisions" className="hover:text-blue-500 transition-colors">Decisions</Link>
            
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button className="text-zinc-500 hover:text-white transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
