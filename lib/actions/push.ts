"use server";

import { createClient } from "@/lib/supabase/server";

export async function savePushSubscription(endpoint: string, p256dh: string, authKey: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ profile_id: user.id, endpoint, p256dh, auth_key: authKey }, { onConflict: "endpoint" });
  return error ? { error: error.message } : {};
}

export async function deletePushSubscription(endpoint: string) {
  const supabase = createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
