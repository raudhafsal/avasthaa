import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StaffTicketReplyForm } from "@/components/business/staff-ticket-reply-form";
import { TicketControls } from "@/components/business/ticket-controls";

export default async function BusinessSupportTicketPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, assigned_staff_id, profiles(full_name, phone)")
    .eq("id", params.id)
    .single();
  if (!ticket) notFound();

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_id, message, created_at")
    .eq("ticket_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{ticket.subject}</h1>
        <p className="ltr-number text-sm text-ink-500">
          {(ticket as any).profiles?.full_name} · {(ticket as any).profiles?.phone}
        </p>
        <p className="text-sm capitalize text-ink-500">{ticket.category}</p>
      </div>

      <TicketControls
        ticketId={ticket.id}
        status={ticket.status}
        assignedStaffId={ticket.assigned_staff_id}
        currentStaffId={user.id}
      />

      <div className="flex flex-col gap-3">
        {(messages ?? []).map((m) => {
          const isMe = m.sender_id === user.id;
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-card p-3 shadow-card ${
                isMe ? "self-end bg-ocean-900 text-white" : "self-start bg-white text-ink-900"
              }`}
            >
              <p className="text-sm">{m.message}</p>
              <p className={`mt-1 text-xs ${isMe ? "text-ocean-100" : "text-ink-500"}`}>
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          );
        })}
      </div>

      {ticket.status !== "closed" && <StaffTicketReplyForm ticketId={ticket.id} />}
    </div>
  );
}
