import Link from "next/link";
import { clsx } from "clsx";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES = ["pending", "accepted", "preparing", "ready", "assigned", "picked_up", "in_transit"];
const COMPLETED_STATUSES = ["delivered"];
const CANCELLED_STATUSES = ["rejected", "cancelled"];

export default async function OrdersPage({ searchParams }: { searchParams: { tab?: string } }) {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const tab = searchParams.tab === "completed" || searchParams.tab === "cancelled" ? searchParams.tab : "active";
  const statuses =
    tab === "completed" ? COMPLETED_STATUSES : tab === "cancelled" ? CANCELLED_STATUSES : ACTIVE_STATUSES;

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_number, status, total_amount, created_at, businesses(name, name_dhivehi)")
    .eq("customer_id", user!.id)
    .in("status", statuses)
    .order("created_at", { ascending: false });

  const tabs = [
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="flex gap-2 rounded-pill bg-sand-200 p-1">
        {tabs.map((t2) => (
          <Link
            key={t2.key}
            href={`/orders?tab=${t2.key}`}
            className={clsx(
              "flex-1 rounded-pill py-2 text-center text-sm font-medium",
              tab === t2.key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
            )}
          >
            {t2.label}
          </Link>
        ))}
      </div>

      {(orders ?? []).length === 0 ? (
        <div className="mt-8 rounded-card bg-white p-6 text-center shadow-card">
          <p className="font-medium text-ink-700">{strings.home.noResults}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(orders ?? []).map((order: any) => {
            const businessName =
              locale === "dv" && order.businesses?.name_dhivehi ? order.businesses.name_dhivehi : order.businesses?.name;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="flex flex-col gap-1 rounded-card bg-white p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-ink-900">{businessName}</p>
                  <span className="ltr-number text-xs text-ink-500">{order.order_number}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize text-ink-500">{order.status.replace("_", " ")}</span>
                  <span className="ltr-number font-semibold text-ocean-900">
                    {strings.common.currency} {order.total_amount.toFixed(2)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
