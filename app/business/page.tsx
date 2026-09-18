import Link from "next/link";
import { getDashboardMetrics, getAllBusinesses } from "@/lib/services/business";

export default async function BusinessDashboardPage() {
  const [metrics, businesses] = await Promise.all([getDashboardMetrics(), getAllBusinesses()]);

  const cards = [
    { label: "Today's orders", value: metrics.todaysOrders, href: "/business/orders" },
    { label: "Today's sales", value: `MVR ${metrics.todaysSales.toFixed(2)}`, href: "/business/reports" },
    { label: "Pending orders", value: metrics.pendingCount, href: "/business/orders?tab=pending" },
    { label: "Active orders", value: metrics.activeCount, href: "/business/orders?tab=active" },
    { label: "Payments to verify", value: metrics.pendingVerifications, href: "/business/payments" },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="grid grid-cols-2 gap-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="rounded-card bg-white p-4 shadow-card">
            <p className="ltr-number text-2xl font-bold text-ink-900">{card.value}</p>
            <p className="text-sm text-ink-500">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
        <p className="font-semibold text-ink-900">Businesses ({businesses.length})</p>
        {businesses.slice(0, 5).map((b) => (
          <Link key={b.id} href={`/business/businesses/${b.id}/menu`} className="text-sm text-ocean-900">
            {b.name} →
          </Link>
        ))}
        <Link href="/business/businesses" className="mt-1 text-sm font-semibold text-ocean-900">
          View all businesses →
        </Link>
      </div>
    </div>
  );
}
