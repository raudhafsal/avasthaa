"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface WalletActionState {
  error?: string;
  success?: boolean;
}

const ALLOWED_SLIP_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SLIP_BYTES = 8 * 1024 * 1024;

export async function requestWalletTopup(
  _prev: WalletActionState,
  formData: FormData,
): Promise<WalletActionState> {
  const amount = Number(formData.get("amount"));
  const file = formData.get("slip") as File | null;

  if (Number.isNaN(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!file || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }
  if (!ALLOWED_SLIP_TYPES.includes(file.type)) {
    return { error: "Upload a JPG, PNG, WEBP, or PDF file." };
  }
  if (file.size > MAX_SLIP_BYTES) {
    return { error: "That file is too large (max 8MB)." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("wallet-topup-slips")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: "Upload failed. Please try again." };

  const { error: insertError } = await supabase.from("wallet_topups").insert({
    profile_id: user.id,
    amount,
    slip_path: path,
  });
  if (insertError) return { error: "Something went wrong. Please try again." };

  revalidatePath("/wallet");
  return { success: true };
}
