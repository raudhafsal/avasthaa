"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavoriteBusiness(businessId: string, isFavorited: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (isFavorited) {
    await supabase.from("favorites").delete().eq("profile_id", user.id).eq("business_id", businessId);
  } else {
    await supabase.from("favorites").insert({ profile_id: user.id, business_id: businessId });
  }
  revalidatePath("/favorites");
}
