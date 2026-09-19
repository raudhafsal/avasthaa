"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const supabase = createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("profile_id", user.id).is("read_at", null);
  revalidatePath("/notifications");
}
