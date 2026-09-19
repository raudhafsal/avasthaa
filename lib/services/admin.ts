import { createClient } from "@/lib/supabase/server";

export async function getPlatformMetrics() {
  const supabase = createClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    { count: customerCount },
    { count: businessCount },
    { count: partnerCount },
    { count: pendingPartnerCount },
    { count: todaysOrders },
    { data: todaysDelivered },
    { count: openTickets },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("delivery_partners").select("id", { count: "exact", head: true }),
    supabase.from("delivery_partners").select("id", { count: "exact", head: true }).eq("approval_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", startOfDay.toISOString()),
    supabase
      .from("orders")
      .select("total_amount, platform_fee")
      .eq("status", "delivered")
      .gte("created_at", startOfDay.toISOString()),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  const todaysSales = (todaysDelivered ?? []).reduce((s, o) => s + o.total_amount, 0);

  return {
    customerCount: customerCount ?? 0,
    businessCount: businessCount ?? 0,
    partnerCount: partnerCount ?? 0,
    pendingPartnerCount: pendingPartnerCount ?? 0,
    todaysOrders: todaysOrders ?? 0,
    todaysSales,
    openTickets: openTickets ?? 0,
  };
}

export async function searchUsers(options: { query?: string; role?: string; limit?: number }) {
  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, email, role, account_status, island_id, created_at")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.role) query = query.eq("role", options.role);
  if (options.query) query = query.or(`full_name.ilike.%${options.query}%,phone.ilike.%${options.query}%,email.ilike.%${options.query}%`);

  const { data } = await query;
  return data ?? [];
}

export async function getAllBusinessesForAdmin() {
  const supabase = createClient();
  const { data } = await supabase
    .from("businesses")
    .select("id, name, business_type, island_id, approval_status, is_open, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAllPartnersForAdmin() {
  const supabase = createClient();
  const { data } = await supabase
    .from("delivery_partners")
    .select("id, vehicle_type, island_id, approval_status, is_online, rating_average, profiles(full_name, phone)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getCoupons() {
  const supabase = createClient();
  const { data } = await supabase
    .from("coupons")
    .select("id, code, discount_type, discount_value, minimum_order, usage_limit, expires_at, active")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAuditLog(limit = 50) {
  const supabase = createClient();
  const { data } = await supabase
    .from("admin_audit_logs")
    .select("id, admin_id, action, entity_type, entity_id, old_value, new_value, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
