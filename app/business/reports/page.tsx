import { createClient } from "@/lib/supabase/server";

const RANGE_DAYS: Record<string, number> = { today: 1, "7d": 7, "30d": 30 };

export default async function BusinessReportsPage({ searchParams }: { searchParams: { range?: string } }) {
  const supabase = createClient();

  const range = searchParams.range && RANGE_DAYS[searchParams.range] ? searchParams.range : "7d";
  const since = new Date();
  since.setDate(since.getDate() - RANGE_DAYS[range]!);

  const { data: orders } = await supabase
    .from("orders")
    .select("status, subtotal, discount_amount, total_amount")
    .gte("created_at", since.toISOString());

  const delivered = (orders ?? []).filter((o) => o.status === "delivered");
  const cancelled = (orders ?? []).filter((o) => o.status === "cancelled" || o.status === "rejected");
  const grossSales = delivered.reduce((s, o) => s + o.subtotal, 0);
  const discounts = delivered.reduce((s, o) => s + o.discount_amount, 0);
  const netSales = delivered.reduce((s, o) => s + o.total_amount, 0);

  const ranges = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 days" },
    { key: "30d", label: "30 days" },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <div className="flex gap-2 rounded-pill bg-sand-200 p-1">
        {ranges.map((r) => (
          <a
            key={r.key}
            href={`/business/reports?range=${r.key}`}
            className={`flex-1 rounded-pill py-2 text-center text-sm font-medium ${
              range === r.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500"
            }`}
          >
            {r.label}
          </a>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">MVR {grossSales.toFixed(2)}</p>
          <p className="text-sm text-ink-500">Gross sales</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">MVR {discounts.toFixed(2)}</p>
          <p className="text-sm text-ink-500">Discounts</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">MVR {netSales.toFixed(2)}</p>
          <p className="text-sm text-ink-500">Net sales</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">{delivered.length}</p>
          <p className="text-sm text-ink-500">Completed orders</p>
        </div>
        <div className="rounded-card bg-white p-4 shadow-card">
          <p className="ltr-number text-2xl font-bold text-ink-900">{cancelled.length}</p>
          <p className="text-sm text-ink-500">Cancelled/rejected</p>
        </div>
      </div>
    </div>
  );
}
