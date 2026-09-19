"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReviewActionState {
  error?: string;
  success?: boolean;
}

export async function submitReview(_prev: ReviewActionState, formData: FormData): Promise<ReviewActionState> {
  const orderId = String(formData.get("orderId"));
  const businessId = String(formData.get("businessId"));
  const businessRating = Number(formData.get("businessRating"));
  const businessComment = (formData.get("businessComment") as string) || null;
  const partnerId = (formData.get("partnerId") as string) || null;
  const partnerRating = formData.get("partnerRating") ? Number(formData.get("partnerRating")) : null;

  if (!orderId || !businessId || Number.isNaN(businessRating) || businessRating < 1 || businessRating > 5) {
    return { error: "Please choose a rating." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { error: businessError } = await supabase.from("reviews").insert({
    profile_id: user.id,
    order_id: orderId,
    business_id: businessId,
    rating: businessRating,
    comment: businessComment,
  });
  if (businessError) return { error: "You may have already reviewed this order." };

  if (partnerId && partnerRating) {
    await supabase.from("reviews").insert({
      profile_id: user.id,
      order_id: orderId,
      partner_id: partnerId,
      rating: partnerRating,
    });
  }

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}
