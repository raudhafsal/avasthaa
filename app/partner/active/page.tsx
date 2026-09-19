import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePartnerProfile, getActiveDelivery } from "@/lib/services/partner";
import { StageActions } from "@/components/partner/stage-actions";

const STAGE_LABELS: Record<string, string> = {
  awaiting_pickup: "Head to pickup",
  picked_up: "Picked up",
  awaiting_boat: "Awaiting boat",
  in_transit_boat: "On the boat",
  arrived_destination: "Arrived at destination island",
  out_for_delivery: "Out for delivery",
};

export default async function PartnerActivePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const partner = await requirePartnerProfile(user.id);
  const delivery = await getActiveDelivery(partner.id);

  if (!delivery) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <p className="text-4xl">📦</p>
        <p className="font-semibold text-ink-900">No active delivery</p>
        <p className="text-sm text-ink-500">Accept a job to see it here.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-10">
      <div className="rounded-card bg-ocean-900 p-4 text-white">
        <p className="text-sm text-ocean-100">Status</p>
        <p className="text-lg font-semibold">{STAGE_LABELS[delivery.stage] ?? delivery.stage}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
        <div>
          <p className="text-xs font-semibold uppercase text-ink-500">Pickup</p>
          <p className="font-medium text-ink-900">{delivery.pickup_contact_name}</p>
          <p className="text-sm text-ink-700">{delivery.pickup_address}</p>
          <p className="ltr-number text-sm text-ink-500">{delivery.pickup_phone}</p>
        </div>
        <div className="border-t border-sand-200 pt-3">
          <p className="text-xs font-semibold uppercase text-ink-500">Drop-off</p>
          <p className="font-medium text-ink-900">{delivery.recipient_name}</p>
          <p className="text-sm text-ink-700">{delivery.destination_address}</p>
          <p className="ltr-number text-sm text-ink-500">{delivery.recipient_phone}</p>
        </div>
        {delivery.package_description && (
          <div className="border-t border-sand-200 pt-3 text-sm text-ink-700">
            <p className="text-xs font-semibold uppercase text-ink-500">Package</p>
            <p>
              {delivery.package_description} · <span className="capitalize">{delivery.package_size}</span>
            </p>
          </div>
        )}
      </div>

      <StageActions deliveryId={delivery.id} stage={delivery.stage} requiresBoat={delivery.requires_boat} />
    </div>
  );
}
