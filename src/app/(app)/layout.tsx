import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthProvider } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  return (
    <AuthProvider>
      <div className="flex min-h-dvh" style={{ backgroundColor: "var(--bg)" }}>
        <Sidebar />
        <main className="flex-1 lg:ml-[260px] min-h-dvh pb-16 lg:pb-0">
          {children}
        </main>
        <MobileNav />
      </div>
    </AuthProvider>
  );
}
