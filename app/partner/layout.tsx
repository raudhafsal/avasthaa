import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PartnerBottomNav } from "@/components/partner/bottom-nav";

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "delivery_partner") redirect("/");

  return (
    <div className="min-h-dvh bg-sand-100 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-ink-900">Avas Thaa Partner</p>
      </header>
      <main>{children}</main>
      <PartnerBottomNav />
    </div>
  );
}
