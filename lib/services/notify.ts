import { createClient } from "@/lib/supabase/server";
import { sendPushToProfile } from "@/lib/services/push";

export async function sendNotification(
  profileId: string,
  category: string,
  title: string,
  body: string,
  referenceOrderId?: string | null,
  referenceDeliveryId?: string | null,
) {
  const supabase = createClient();
  // Best-effort: a failed notification should never block the
  // underlying order/payment/delivery action that triggered it.
  await supabase.rpc("send_notification", {
    p_profile_id: profileId,
    p_category: category,
    p_title: title,
    p_body: body,
    p_reference_order_id: referenceOrderId ?? null,
    p_reference_delivery_id: referenceDeliveryId ?? null,
  });

  // Web push is additive on top of the in-app notification above —
  // never lets a push failure surface to the caller.
  const url = referenceOrderId ? `/orders/${referenceOrderId}` : "/notifications";
  await sendPushToProfile(profileId, title, body, url).catch(() => {});
}
