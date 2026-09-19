import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPartnerProfile } from "@/lib/services/partner";
import { PartnerOnboardingForm } from "@/components/partner/onboarding-form";

export default async function PartnerOnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const existing = await getPartnerProfile(user.id);
  if (existing) redirect("/partner");

  const { data: islands } = await supabase.from("islands").select("id, island_name").order("island_name");

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold text-ink-900">A few details</h1>
        <p className="mt-1 text-sm text-ink-500">This helps us match you with nearby delivery jobs.</p>
      </div>
      <PartnerOnboardingForm islands={islands ?? []} />
    </div>
  );
}
