import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePartnerProfile, getPartnerEarningsSummary } from "@/lib/services/partner";

export default async function PartnerEarningsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const partner = await requirePartnerProfile(user.id);
  const earnings = await getPartnerEarningsSummary(partner.id);

  const { data: payouts } = await supabase
    .from("payouts")
    .select("id, amount, period_start, period_end, status")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const cards = [
    { label: "Today", value: earnings.today },
    { label: "This week", value: earnings.thisWeek },
    { label: "This month", value: earnings.thisMonth },
    { label: "Total earned", value: earnings.total },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Earnings</h1>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-card bg-white p-4 shadow-card">
            <p className="ltr-number text-2xl font-bold text-ink-900">MVR {card.value.toFixed(2)}</p>
            <p className="text-sm text-ink-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-card bg-lagoon-50 p-4">
        <p className="ltr-number text-xl font-bold text-lagoon-700">MVR {earnings.pendingPayout.toFixed(2)}</p>
        <p className="text-sm text-lagoon-600">Pending payout</p>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-ink-900">Payout history</h2>
        {(payouts ?? []).length === 0 ? (
          <p className="text-sm text-ink-500">No payouts yet.</p>
        ) : (
          (payouts ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-card bg-white p-3 shadow-card">
              <span className="text-sm text-ink-700">
                {p.period_start} – {p.period_end}
              </span>
              <span className="ltr-number font-semibold text-ink-900">MVR {p.amount.toFixed(2)}</span>
              <span className="text-xs capitalize text-ink-500">{p.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
