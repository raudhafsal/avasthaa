"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface AdminActionState {
  error?: string;
  success?: boolean;
}

async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  oldValue: unknown,
  newValue: unknown,
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("admin_audit_logs").insert({
    admin_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_value: oldValue,
    new_value: newValue,
  });
}

// ── Users ──────────────────────────────────────────────────────────────
export async function updateUserStatus(userId: string, status: string, oldStatus: string) {
  const supabase = createClient();
  const { error } = await supabase.from("profiles").update({ account_status: status }).eq("id", userId);
  if (!error) {
    await logAudit("user.status_change", "profiles", userId, { account_status: oldStatus }, { account_status: status });
  }
  revalidatePath("/admin/users");
  return error ? { error: error.message } : {};
}

// ── Businesses ────────────────────────────────────────────────────────
export async function updateBusinessApproval(businessId: string, status: string, oldStatus: string) {
  const supabase = createClient();
  const { error } = await supabase.from("businesses").update({ approval_status: status }).eq("id", businessId);
  if (!error) {
    await logAudit(
      "business.approval_change",
      "businesses",
      businessId,
      { approval_status: oldStatus },
      { approval_status: status },
    );
  }
  revalidatePath("/admin/businesses");
  return error ? { error: error.message } : {};
}

// ── Delivery partners ────────────────────────────────────────────────
export async function updatePartnerApproval(partnerId: string, status: string, oldStatus: string) {
  const supabase = createClient();
  const { error } = await supabase.from("delivery_partners").update({ approval_status: status }).eq("id", partnerId);
  if (!error) {
    await logAudit(
      "partner.approval_change",
      "delivery_partners",
      partnerId,
      { approval_status: oldStatus },
      { approval_status: status },
    );
  }
  revalidatePath("/admin/partners");
  return error ? { error: error.message } : {};
}

// ── Pricing ───────────────────────────────────────────────────────────
export async function updatePricingSettings(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const baseDeliveryFee = Number(formData.get("baseDeliveryFee"));
  const perKmFee = Number(formData.get("perKmFee"));
  const expressFee = Number(formData.get("expressFee"));
  const scheduledFee = Number(formData.get("scheduledFee"));
  const commissionPercent = Number(formData.get("commissionPercent"));
  const defaultMinimumOrder = Number(formData.get("defaultMinimumOrder"));

  if ([baseDeliveryFee, perKmFee, expressFee, scheduledFee, commissionPercent, defaultMinimumOrder].some(Number.isNaN)) {
    return { error: "Every field must be a valid number." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("pricing_settings")
    .update({
      base_delivery_fee: baseDeliveryFee,
      per_km_fee: perKmFee,
      express_fee: expressFee,
      scheduled_fee: scheduledFee,
      platform_commission_percent: commissionPercent,
      default_minimum_order: defaultMinimumOrder,
    })
    .eq("id", true);

  if (error) return { error: "Something went wrong. Please try again." };
  await logAudit("pricing.update", "pricing_settings", "singleton", null, {
    baseDeliveryFee,
    perKmFee,
    expressFee,
    scheduledFee,
    commissionPercent,
    defaultMinimumOrder,
  });
  revalidatePath("/admin/pricing");
  return { success: true };
}

export async function updatePackageSizeFee(size: string, fee: number) {
  const supabase = createClient();
  await supabase.from("package_size_fees").update({ fee }).eq("package_size", size);
  revalidatePath("/admin/pricing");
}

// ── Coupons ───────────────────────────────────────────────────────────
export async function createCoupon(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discountType") ?? "");
  const discountValue = Number(formData.get("discountValue"));
  const minimumOrder = Number(formData.get("minimumOrder") ?? 0);
  const usageLimit = formData.get("usageLimit") ? Number(formData.get("usageLimit")) : null;
  const expiresAt = String(formData.get("expiresAt") ?? "");

  if (!code || !discountType || Number.isNaN(discountValue) || !expiresAt) {
    return { error: "Please fill in every required field." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("coupons").insert({
    code,
    discount_type: discountType,
    discount_value: discountValue,
    minimum_order: minimumOrder,
    usage_limit: usageLimit,
    expires_at: new Date(expiresAt).toISOString(),
  });
  if (error) return { error: error.message.includes("duplicate") ? "That code already exists." : "Something went wrong." };

  revalidatePath("/admin/coupons");
  return { success: true };
}

export async function toggleCouponActive(couponId: string, active: boolean) {
  const supabase = createClient();
  await supabase.from("coupons").update({ active }).eq("id", couponId);
  revalidatePath("/admin/coupons");
}

// ── Islands ───────────────────────────────────────────────────────────
export async function createIsland(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const islandName = String(formData.get("islandName") ?? "").trim();
  const islandNameDhivehi = String(formData.get("islandNameDhivehi") ?? "").trim();
  const islandFee = Number(formData.get("islandFee") ?? 0);

  if (!islandName || !islandNameDhivehi) {
    return { error: "Both English and Dhivehi names are required." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("islands").insert({
    island_name: islandName,
    island_name_dhivehi: islandNameDhivehi,
    island_delivery_fee: islandFee,
  });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/islands");
  return { success: true };
}

export async function toggleIslandDeliveryEnabled(islandId: string, enabled: boolean) {
  const supabase = createClient();
  await supabase.from("islands").update({ delivery_enabled: enabled }).eq("id", islandId);
  revalidatePath("/admin/islands");
}

// ── App settings ──────────────────────────────────────────────────────
export async function updateAppSetting(_prev: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const key = String(formData.get("key") ?? "");
  const rawValue = String(formData.get("value") ?? "");
  if (!key) return { error: "Missing setting key." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return { error: "Invalid value format." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("app_settings")
    .update({ value: parsed, updated_by: user?.id ?? null })
    .eq("key", key);
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/admin/settings");
  return { success: true };
}
