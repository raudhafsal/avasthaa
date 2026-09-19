"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SupportActionState {
  error?: string;
}

export async function createSupportTicket(_prev: SupportActionState, formData: FormData): Promise<SupportActionState> {
  const category = String(formData.get("category") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const relatedOrderId = (formData.get("relatedOrderId") as string) || null;

  if (!category || !subject || !message) {
    return { error: "Please fill in every field." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ profile_id: user.id, category, subject, related_order_id: relatedOrderId })
    .select("id")
    .single();
  if (error || !ticket) return { error: "Something went wrong. Please try again." };

  await supabase.from("support_messages").insert({ ticket_id: ticket.id, sender_id: user.id, message });

  revalidatePath("/support");
  redirect(`/support/${ticket.id}`);
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const supabase = createClient();
  await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
  revalidatePath(`/business/support/${ticketId}`);
  revalidatePath("/business/support");
}

export async function assignTicketToSelf(ticketId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("support_tickets").update({ assigned_staff_id: user.id }).eq("id", ticketId);
  revalidatePath(`/business/support/${ticketId}`);
  revalidatePath("/business/support");
}
export async function sendSupportMessage(_prev: SupportActionState, formData: FormData): Promise<SupportActionState> {
  const ticketId = String(formData.get("ticketId"));
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Message can't be empty." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please log in again." };

  const { error } = await supabase
    .from("support_messages")
    .insert({ ticket_id: ticketId, sender_id: user.id, message });
  if (error) return { error: "Something went wrong. Please try again." };

  revalidatePath(`/support/${ticketId}`);
  revalidatePath(`/business/support/${ticketId}`);
  return {};
}
