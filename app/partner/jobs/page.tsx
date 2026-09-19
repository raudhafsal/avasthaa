import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePartnerProfile, getAvailableJobs, getActiveDelivery } from "@/lib/services/partner";
import { AcceptJobButton } from "@/components/partner/accept-job-button";

export default async function PartnerJobsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const partner = await requirePartnerProfile(user.id);
  const active = await getActiveDelivery(partner.id);
  if (active) redirect("/partner/active");

  const jobs = await getAvailableJobs(partner.island_id);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Available jobs</h1>

      {jobs.length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No jobs waiting right now — check back soon.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job: any) => (
            <div key={job.id} className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold capitalize text-ink-900">{job.kind.replace("_", " ")}</span>
                <span className="ltr-number font-semibold text-ocean-900">MVR {job.total_fee.toFixed(2)}</span>
              </div>
              <p className="text-sm text-ink-700">Pickup: {job.pickup_address}</p>
              <p className="text-sm text-ink-700">Drop-off: {job.destination_address}</p>
              <div className="flex gap-2 text-xs text-ink-500">
                <span className="capitalize">{job.package_size}</span>
                {job.requires_boat && <span>· Boat required</span>}
              </div>
              <AcceptJobButton deliveryId={job.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
