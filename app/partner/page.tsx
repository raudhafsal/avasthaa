import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePartnerProfile, getActiveDelivery, getAvailableJobs, getPartnerEarningsSummary } from "@/lib/services/partner";
import { PartnerOnlineToggle } from "@/components/partner/online-toggle";

export default async function PartnerHomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const partner = await requirePartnerProfile(user.id);
  const [activeDelivery, availableJobs, earnings] = await Promise.all([
    getActiveDelivery(partner.id),
    getAvailableJobs(partner.island_id),
    getPartnerEarningsSummary(partner.id),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <PartnerOnlineToggle isOnline={partner.is_online} />

      {activeDelivery && (
        <Link href="/partner/active" className="rounded-card bg-ocean-900 p-4 text-white shadow-card">
          <p className="font-semibold">You have an active delivery</p>
          <p className="text-sm text-ocean-100 capitalize">{activeDelivery.stage.replace(/_/g, " ")}</p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">MVR {earnings.today.toFixed(2)}</p>
          <p className="text-sm text-ink-500">Today&rsquo;s earnings</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">{earnings.completedJobsToday}</p>
          <p className="text-sm text-ink-500">Completed today</p>
        </div>
      </div>

      <Link href="/partner/jobs" className="rounded-card bg-white p-4 shadow-card">
        <p className="font-semibold text-ink-900">Available jobs</p>
        <p className="text-sm text-ink-500">{availableJobs.length} waiting nearby</p>
      </Link>
    </div>
  );
}
