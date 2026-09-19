import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BusinessBottomNav } from "@/components/business/bottom-nav";

export default async function BusinessLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Defense in depth alongside the middleware's role gate: confirm the
  // signed-in account is actually staff/admin before rendering anything.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["staff", "administrator", "super_administrator"].includes(profile.role)) {
    redirect("/");
  }

  return (
    <div className="min-h-dvh bg-sand-100 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-ink-900">Avas Thaa Staff</p>
      </header>

      <main>{children}</main>

      <BusinessBottomNav />
    </div>
  );
}
