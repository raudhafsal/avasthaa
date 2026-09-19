import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewTicketForm } from "@/components/customer/new-ticket-form";

export default async function SupportPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Help & support</h1>
      <NewTicketForm />

      {(tickets ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No support requests yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(tickets ?? []).map((ticket) => (
            <Link key={ticket.id} href={`/support/${ticket.id}`} className="rounded-card bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{ticket.subject}</p>
                <span className="text-xs capitalize text-ink-500">{ticket.status.replace("_", " ")}</span>
              </div>
              <p className="text-sm capitalize text-ink-500">{ticket.category}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
