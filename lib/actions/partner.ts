"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/services/notify";

export interface PartnerActionState {
  error?: string;
}

export async function completePartnerOnboarding(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const vehicleType = String(formData.get("vehicleType") ?? "");
  const vehicleRegistration = (formData.get("vehicleRegistration") as string) || null;
  const islandId = String(formData.get("islandId") ?? "");

  if (!vehicleType || !islandId) {
    return { error: "Please fill in every required field." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { error } = await supabase.from("delivery_partners").insert({
    id: user.id,
    vehicle_type: vehicleType,
    vehicle_registration: vehicleRegistration,
    island_id: islandId,
  });
  if (error) return { error: "Something went wrong. Please try again." };

  redirect("/partner");
}

export async function updatePartnerProfile(
  _prev: PartnerActionState,
  formData: FormData,
): Promise<PartnerActionState> {
  const vehicleType = String(formData.get("vehicleType") ?? "");
  const vehicleRegistration = (formData.get("vehicleRegistration") as string) || null;
  const islandId = String(formData.get("islandId") ?? "");

  if (!vehicleType || !islandId) {
    return { error: "Please fill in every required field." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { error } = await supabase
    .from("delivery_partners")
    .update({ vehicle_type: vehicleType, vehicle_registration: vehicleRegistration, island_id: islandId })
    .eq("id", user.id);
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath("/partner/profile");
  return {};
}
export async function toggleOnline(isOnline: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("delivery_partners").update({ is_online: isOnline }).eq("id", user.id);
  revalidatePath("/partner");
}

export async function claimJob(deliveryId: string): Promise<PartnerActionState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  // The WHERE clause (assigned_partner_id is null) is what makes this
  // race-safe: if two partners tap "Accept" on the same job at once,
  // whichever UPDATE commits first wins, and the second sees 0 rows
  // affected against the now-assigned row (Postgres row locking).
  const { data, error } = await supabase
    .from("deliveries")
    .update({ assigned_partner_id: user.id, assigned_at: new Date().toISOString() })
    .eq("id", deliveryId)
    .is("assigned_partner_id", null)
    .select("id, order_id, customer_id")
    .maybeSingle();

  if (error || !data) {
    return { error: "That job was just taken by someone else." };
  }

  if (data.order_id) {
    await supabase.from("orders").update({ status: "assigned" }).eq("id", data.order_id);
  }
  await sendNotification(
    data.customer_id,
    "delivery_update",
    "Delivery partner assigned",
    "A delivery partner has been assigned to your order.",
    data.order_id ?? null,
    deliveryId,
  );

  revalidatePath("/partner");
  revalidatePath("/partner/jobs");
  revalidatePath("/partner/active");
  return {};
}

const ORDER_STATUS_FOR_STAGE: Record<string, string> = {
  picked_up: "picked_up",
  awaiting_boat: "in_transit",
  in_transit_boat: "in_transit",
  arrived_destination: "in_transit",
  out_for_delivery: "in_transit",
};

export async function advanceDeliveryStage(deliveryId: string, nextStage: string): Promise<PartnerActionState> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("deliveries")
    .update({ stage: nextStage })
    .eq("id", deliveryId)
    .select("order_id")
    .maybeSingle();

  if (error) return { error: "Something went wrong. Please try again." };

  const orderStatus = ORDER_STATUS_FOR_STAGE[nextStage];
  if (data?.order_id && orderStatus) {
    await supabase.from("orders").update({ status: orderStatus }).eq("id", data.order_id);
  }

  revalidatePath("/partner/active");
  return {};
}

export async function completeDeliveryWithOtp(
  deliveryId: string,
  otp: string,
): Promise<PartnerActionState> {
  const supabase = createClient();

  const { data: delivery } = await supabase
    .from("deliveries")
    .select("id, order_id, customer_id, delivery_otp, total_fee, stage")
    .eq("id", deliveryId)
    .single();

  if (!delivery) return { error: "Delivery not found." };
  if (delivery.stage === "delivered") return { error: "Already completed." };
  if (delivery.delivery_otp !== otp) return { error: "That code doesn't match. Ask the customer to check again." };

  const { error: stageError } = await supabase
    .from("deliveries")
    .update({ stage: "delivered", otp_verified_at: new Date().toISOString() })
    .eq("id", deliveryId);
  if (stageError) return { error: "Something went wrong. Please try again." };

  if (delivery.order_id) {
    await supabase.from("orders").update({ status: "delivered" }).eq("id", delivery.order_id);
  }

  await sendNotification(
    delivery.customer_id,
    "delivery_update",
    "Delivered",
    "Your order has been delivered. Enjoy!",
    delivery.order_id ?? null,
    deliveryId,
  );

  const { error: earningError } = await supabase.rpc("record_partner_earning", {
    p_delivery_id: deliveryId,
    p_customer_paid: delivery.total_fee,
  });
  if (earningError) {
    // Delivery is already marked delivered at this point; earnings can be
    // reconciled by an admin if this ever fails, but we still tell the
    // partner clearly since it affects their payout.
    return { error: "Delivered, but recording your earnings failed — contact support." };
  }

  revalidatePath("/partner/active");
  revalidatePath("/partner/earnings");
  return {};
}
