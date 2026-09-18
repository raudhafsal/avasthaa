import { createClient } from "@/lib/supabase/server";

export interface BusinessSummary {
  id: string;
  name: string;
  business_type: string;
  island_id: string;
  is_open: boolean;
  approval_status: string;
}

export async function getAllBusinesses(): Promise<BusinessSummary[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("businesses")
    .select("id, name, business_type, island_id, is_open, approval_status")
    .order("name");
  return data ?? [];
}

export async function getBusinessForStaff(businessId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, name_dhivehi, business_type, logo_url, cover_image_url, description, phone, island_id, address, delivery_fee, minimum_order, estimated_prep_minutes, is_open, approval_status, rating_average, rating_count",
    )
    .eq("id", businessId)
    .maybeSingle();
  return data;
}

/** Unified queue: every business's orders in one list, newest first. */
export async function getOrderQueue(statuses: string[]) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, total_amount, payment_method, contact_phone, special_instructions, created_at, customer_id, delivery_address_id, business_id, businesses(name), order_items(id, item_name, quantity, line_total, selected_options)",
    )
    .in("status", statuses)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getDashboardMetrics() {
  const supabase = createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ count: todaysOrders }, { data: todaysSalesRows }, { count: pendingCount }, { count: activeCount }, { count: pendingVerifications }] =
    await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
      supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "delivered")
        .gte("created_at", startOfDay.toISOString()),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["accepted", "preparing", "ready"]),
      supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("provider", "bank_transfer")
        .eq("status", "pending")
        .not("slip_path", "is", null),
    ]);

  const todaysSales = (todaysSalesRows ?? []).reduce((sum: number, o: any) => sum + o.total_amount, 0);

  return {
    todaysOrders: todaysOrders ?? 0,
    todaysSales,
    pendingCount: pendingCount ?? 0,
    activeCount: activeCount ?? 0,
    pendingVerifications: pendingVerifications ?? 0,
  };
}
