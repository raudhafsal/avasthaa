"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendNotification } from "@/lib/services/notify";

export interface BusinessActionState {
  error?: string;
  success?: boolean;
}

// RLS (orders_select_business) already restricts which orders a
// non-staff caller can even see, so this just fetches — no separate
// ownership check needed now that any staff manages any business.
async function getOrderForReadyTransition(orderId: string) {
  const supabase = createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, business_id, status, delivery_address_id, customer_id, businesses(island_id, address, name, phone)")
    .eq("id", orderId)
    .single();
  if (!order) throw new Error("Order not found");
  return order as any;
}

export async function acceptOrder(orderId: string): Promise<BusinessActionState> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "accepted" })
    .eq("id", orderId)
    .select("customer_id, businesses(name)")
    .single();
  if (!error && data) {
    await sendNotification(
      (data as any).customer_id,
      "order_update",
      "Order accepted",
      `${(data as any).businesses?.name ?? "The restaurant"} accepted your order and will start preparing it.`,
      orderId,
    );
  }
  revalidatePath("/business/orders");
  return error ? { error: error.message } : { success: true };
}

export async function rejectOrder(orderId: string, reason: string): Promise<BusinessActionState> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "rejected", rejection_reason: reason })
    .eq("id", orderId)
    .select("customer_id, businesses(name)")
    .single();
  if (!error && data) {
    await sendNotification(
      (data as any).customer_id,
      "order_update",
      "Order rejected",
      `${(data as any).businesses?.name ?? "The restaurant"} couldn't accept your order: ${reason}`,
      orderId,
    );
  }
  revalidatePath("/business/orders");
  return error ? { error: error.message } : { success: true };
}

export async function markPreparing(orderId: string): Promise<BusinessActionState> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "preparing" })
    .eq("id", orderId)
    .select("customer_id")
    .single();
  if (!error && data) {
    await sendNotification((data as any).customer_id, "order_update", "Preparing your order", "Your order is now being prepared.", orderId);
  }
  revalidatePath("/business/orders");
  return error ? { error: error.message } : { success: true };
}

/**
 * Marks the order ready and opens the delivery job: creates an
 * unassigned `deliveries` row (visible to available partners per the
 * deliveries_select_available_to_partners RLS policy) so the delivery
 * partner portal can pick it up. The customer-facing OTP is generated
 * here and shown to them; the partner enters it at handoff.
 */
export async function markReady(orderId: string): Promise<BusinessActionState> {
  const supabase = createClient();

  try {
    const order = await getOrderForReadyTransition(orderId);
    const business = order.businesses;

    const [{ data: address }] = await Promise.all([
      supabase
        .from("addresses")
        .select("island_id, address_line, contact_phone, latitude, longitude")
        .eq("id", order.delivery_address_id)
        .single(),
    ]);

    const { data: customerProfile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", order.customer_id)
      .single();

    const { data: fee } = await supabase
      .rpc("calculate_delivery_fee", {
        p_origin_island_id: business.island_id,
        p_destination_island_id: address?.island_id ?? business.island_id,
        p_package_size: "small",
        p_delivery_type: "standard",
      })
      .single();

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    const { error: deliveryError } = await supabase.from("deliveries").insert({
      kind: "food_order",
      order_id: orderId,
      customer_id: order.customer_id,
      delivery_type: "standard",
      pickup_island_id: business.island_id,
      pickup_address: business.address,
      pickup_contact_name: business.name,
      pickup_phone: business.phone,
      destination_island_id: address?.island_id ?? business.island_id,
      destination_address: address?.address_line ?? "",
      recipient_name: customerProfile?.full_name ?? "Customer",
      recipient_phone: address?.contact_phone ?? customerProfile?.phone ?? "",
      destination_latitude: address?.latitude,
      destination_longitude: address?.longitude,
      delivery_otp: otp,
      base_fee: (fee as any)?.base_fee ?? 0,
      island_fee: (fee as any)?.island_fee ?? 0,
      distance_fee: (fee as any)?.distance_fee ?? 0,
      total_fee: (fee as any)?.total_fee ?? 0,
    });
    if (deliveryError) return { error: deliveryError.message };

    const { error: orderError } = await supabase.from("orders").update({ status: "ready" }).eq("id", orderId);
    if (orderError) return { error: orderError.message };

    await sendNotification(
      order.customer_id,
      "order_update",
      "Order ready",
      `Your order is ready and waiting for a delivery partner. Your handoff code is ${otp}.`,
      orderId,
    );
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }

  revalidatePath("/business/orders");
  return { success: true };
}

export async function toggleBusinessOpen(businessId: string, isOpen: boolean) {
  const supabase = createClient();
  await supabase.from("businesses").update({ is_open: isOpen }).eq("id", businessId);
  revalidatePath("/business");
  revalidatePath("/business/businesses");
}
