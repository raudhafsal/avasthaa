import Link from "next/link";
import { getPlatformMetrics } from "@/lib/services/admin";

export default async function AdminDashboardPage() {
  const metrics = await getPlatformMetrics();

  const cards = [
    { label: "Customers", value: metrics.customerCount, href: "/admin/users?role=customer" },
    { label: "Businesses", value: metrics.businessCount, href: "/admin/businesses" },
    { label: "Delivery partners", value: metrics.partnerCount, href: "/admin/partners" },
    { label: "Partner approvals pending", value: metrics.pendingPartnerCount, href: "/admin/partners?tab=pending" },
    { label: "Today's orders", value: metrics.todaysOrders, href: "/business/orders" },
    { label: "Today's sales", value: `MVR ${metrics.todaysSales.toFixed(2)}`, href: "/business/reports" },
    { label: "Open support tickets", value: metrics.openTickets, href: "/business/support" },
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
        <p className="font-semibold text-ink-900">Quick links</p>
        <Link href="/admin/pricing" className="text-sm text-ocean-900">
          Pricing & commission settings →
        </Link>
        <Link href="/admin/islands" className="text-sm text-ocean-900">
          Manage islands →
        </Link>
        <Link href="/admin/coupons" className="text-sm text-ocean-900">
          Coupons →
        </Link>
        <Link href="/admin/audit-log" className="text-sm text-ocean-900">
          Audit log →
        </Link>
      </div>
    </div>
  );
}
