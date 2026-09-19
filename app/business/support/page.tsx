import Link from "next/link";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export default async function BusinessSupportPage({ searchParams }: { searchParams: { status?: string } }) {
  const supabase = createClient();
  const status = searchParams.status && STATUSES.includes(searchParams.status) ? searchParams.status : "open";

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, subject, category, status, created_at, profiles(full_name, phone)")
    .eq("status", status)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Support tickets</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUSES.map((s) => (
          <a
            key={s}
            href={`/business/support?status=${s}`}
            className={clsx(
              "shrink-0 rounded-pill border px-3 py-1.5 text-xs font-medium capitalize",
              status === s ? "border-ocean-900 bg-ocean-900 text-white" : "border-sand-200 bg-white text-ink-700",
            )}
          >
            {s.replace("_", " ")}
          </a>
        ))}
      </div>

      {(tickets ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-500">Nothing here.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(tickets ?? []).map((ticket: any) => (
            <Link key={ticket.id} href={`/business/support/${ticket.id}`} className="rounded-card bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-ink-900">{ticket.subject}</p>
                <span className="text-xs capitalize text-ink-500">{ticket.category}</span>
              </div>
              <p className="ltr-number text-sm text-ink-500">
                {ticket.profiles?.full_name} · {ticket.profiles?.phone}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
