import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getPartnerProfile(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("delivery_partners")
    .select("id, vehicle_type, vehicle_registration, island_id, is_online, approval_status, rating_average, rating_count")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

/** Every /partner page except onboarding calls this first. */
export async function requirePartnerProfile(userId: string) {
  const partner = await getPartnerProfile(userId);
  if (!partner) redirect("/partner/onboarding");
  return partner;
}

export async function getAvailableJobs(islandId?: string | null) {
  const supabase = createClient();
  let query = supabase
    .from("deliveries")
    .select(
      "id, kind, delivery_type, pickup_island_id, pickup_address, destination_island_id, destination_address, package_size, requires_boat, total_fee, created_at",
    )
    .is("assigned_partner_id", null)
    .order("created_at", { ascending: true });
  if (islandId) query = query.eq("pickup_island_id", islandId);
  const { data } = await query;
  return data ?? [];
}

export async function getActiveDelivery(partnerId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("deliveries")
    .select(
      "id, kind, stage, order_id, pickup_address, pickup_contact_name, pickup_phone, destination_address, recipient_name, recipient_phone, package_description, package_size, requires_boat, delivery_otp, total_fee",
    )
    .eq("assigned_partner_id", partnerId)
    .neq("stage", "delivered")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getPartnerEarningsSummary(partnerId: string) {
  const supabase = createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);

  const { data: earnings } = await supabase
    .from("partner_earnings")
    .select("partner_amount, created_at, payout_id")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: false });

  const rows = earnings ?? [];
  const sum = (predicate: (d: Date) => boolean) =>
    rows.filter((r) => predicate(new Date(r.created_at))).reduce((s, r) => s + r.partner_amount, 0);

  return {
    today: sum((d) => d >= startOfDay),
    thisWeek: sum((d) => d >= startOfWeek),
    thisMonth: sum((d) => d >= startOfMonth),
    total: rows.reduce((s, r) => s + r.partner_amount, 0),
    pendingPayout: rows.filter((r) => !r.payout_id).reduce((s, r) => s + r.partner_amount, 0),
    completedJobsToday: rows.filter((r) => new Date(r.created_at) >= startOfDay).length,
  };
}
