"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SettingsActionState {
  error?: string;
  success?: boolean;
}

export async function updateBusinessProfile(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const businessId = String(formData.get("businessId"));
  const name = String(formData.get("name") ?? "").trim();
  const description = (formData.get("description") as string) || null;
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const deliveryFee = Number(formData.get("deliveryFee"));
  const minimumOrder = Number(formData.get("minimumOrder"));
  const estimatedPrepMinutes = Number(formData.get("estimatedPrepMinutes"));

  if (!name || !phone || !address || Number.isNaN(deliveryFee) || Number.isNaN(minimumOrder)) {
    return { error: "Please fill in every required field with valid values." };
  }

  const supabase = createClient();
  // No ownership filter: RLS (businesses_update_staff) is what actually
  // restricts this to staff/admin accounts — any staff manages any
  // business, so there's no per-row check to add here in app code.
  const { error } = await supabase
    .from("businesses")
    .update({
      name,
      description,
      phone,
      address,
      delivery_fee: deliveryFee,
      minimum_order: minimumOrder,
      estimated_prep_minutes: estimatedPrepMinutes,
    })
    .eq("id", businessId);

  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/business/businesses/${businessId}/settings`);
  revalidatePath("/business/businesses");
  return { success: true };
}

export async function createBusiness(_prev: SettingsActionState, formData: FormData): Promise<SettingsActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const businessType = String(formData.get("businessType") ?? "");
  const islandId = String(formData.get("islandId") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const deliveryFee = Number(formData.get("deliveryFee") ?? 0);
  const minimumOrder = Number(formData.get("minimumOrder") ?? 0);

  if (!name || !businessType || !islandId || !phone || !address) {
    return { error: "Please fill in every required field." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: created, error } = await supabase
    .from("businesses")
    .insert({
      created_by: user?.id ?? null,
      name,
      business_type: businessType,
      island_id: islandId,
      phone,
      address,
      delivery_fee: deliveryFee,
      minimum_order: minimumOrder,
    })
    .select("id")
    .single();

  if (error || !created) return { error: "Something went wrong. Please try again." };

  revalidatePath("/business/businesses");
  redirect(`/business/businesses/${created.id}/settings`);
}
