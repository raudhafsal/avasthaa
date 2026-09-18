"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface PaymentActionState {
  error?: string;
  success?: boolean;
}

const ALLOWED_SLIP_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SLIP_BYTES = 8 * 1024 * 1024; // 8MB

export async function uploadPaymentSlip(
  _prev: PaymentActionState,
  formData: FormData,
): Promise<PaymentActionState> {
  const orderId = String(formData.get("orderId"));
  const file = formData.get("slip") as File | null;

  if (!orderId || !file || file.size === 0) {
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
  const path = `${orderId}/${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("payment-slips")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  const { error: attachError } = await supabase.rpc("attach_payment_slip", {
    p_order_id: orderId,
    p_slip_path: path,
  });
  if (attachError) {
    return { error: "Something went wrong recording your upload. Please try again." };
  }

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function verifyBankTransfer(
  paymentId: string,
  approve: boolean,
  note: string | null,
): Promise<PaymentActionState> {
  const supabase = createClient();
  const { error } = await supabase.rpc("verify_bank_transfer_payment", {
    p_payment_id: paymentId,
    p_approve: approve,
    p_note: note,
  });
  revalidatePath("/business/payments");
  return error ? { error: error.message } : { success: true };
}

/** Signed URL so staff can view a private slip image/PDF in the browser. */
export async function getSlipSignedUrl(slipPath: string): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage.from("payment-slips").createSignedUrl(slipPath, 60 * 10);
  return data?.signedUrl ?? null;
}
