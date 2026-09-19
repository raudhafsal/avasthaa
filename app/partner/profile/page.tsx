import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePartnerProfile } from "@/lib/services/partner";
import { PartnerProfileForm } from "@/components/partner/profile-form";

export default async function PartnerProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const partner = await requirePartnerProfile(user.id);
  const { data: islands } = await supabase.from("islands").select("id, island_name").order("island_name");

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold text-ink-900">Profile</h1>
        <div className="mt-1 flex items-center gap-2 text-sm text-ink-500">
          <span>⭐ {partner.rating_count > 0 ? partner.rating_average.toFixed(1) : "No ratings yet"}</span>
          <span>·</span>
          <span className="capitalize">{partner.approval_status}</span>
        </div>
      </div>
      <PartnerProfileForm partner={partner} islands={islands ?? []} />
    </div>
  );
}
