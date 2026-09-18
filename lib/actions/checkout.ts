"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface CheckoutState {
  error?: string;
}

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const cartId = String(formData.get("cartId"));
  const deliveryAddressId = String(formData.get("deliveryAddressId"));
  const deliveryMethod = String(formData.get("deliveryMethod"));
  const paymentMethod = String(formData.get("paymentMethod"));
  const contactPhone = String(formData.get("contactPhone"));
  const specialInstructions = (formData.get("specialInstructions") as string) || null;
  const couponCode = (formData.get("couponCode") as string) || null;

  if (!cartId || !deliveryAddressId || !contactPhone) {
    return { error: "Please fill in every required field." };
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_cart_id: cartId,
    p_delivery_address_id: deliveryAddressId,
    p_delivery_method: deliveryMethod,
    p_payment_method: paymentMethod,
    p_contact_phone: contactPhone,
    p_special_instructions: specialInstructions,
    p_coupon_code: couponCode || null,
  });

  if (error || !data) {
    return { error: error?.message ?? "Something went wrong. Please try again." };
  }

  const order = Array.isArray(data) ? data[0] : data;
  redirect(`/orders/${order.id}?justPlaced=1`);
}
