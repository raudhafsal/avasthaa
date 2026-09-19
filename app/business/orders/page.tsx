import { clsx } from "clsx";
import { getOrderQueue } from "@/lib/services/business";
import { OrderActionButtons } from "@/components/business/order-action-buttons";

const TAB_STATUSES: Record<string, string[]> = {
  pending: ["pending"],
  active: ["accepted", "preparing", "ready"],
  completed: ["delivered", "rejected", "cancelled"],
};

export default async function BusinessOrdersPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab && TAB_STATUSES[searchParams.tab] ? searchParams.tab : "pending";
  const orders = await getOrderQueue(TAB_STATUSES[tab]!);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="flex gap-2 rounded-pill bg-sand-200 p-1">
        {Object.keys(TAB_STATUSES).map((key) => (
          <a
            key={key}
            href={`/business/orders?tab=${key}`}
            className={clsx(
              "flex-1 rounded-pill py-2 text-center text-sm font-medium capitalize",
              tab === key ? "bg-white text-ink-900 shadow-sm" : "text-ink-500",
            )}
          >
            {key}
          </a>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No orders here yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order: any) => (
            <div key={order.id} className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-900">{order.businesses?.name}</span>
                <span className="ltr-number font-semibold text-ocean-900">
                  MVR {order.total_amount.toFixed(2)}
                </span>
              </div>
              <span className="ltr-number text-xs text-ink-500">{order.order_number}</span>
              <div className="flex flex-col gap-0.5 text-sm text-ink-700">
                {(order.order_items ?? []).map((item: any) => (
                  <p key={item.id}>
                    {item.quantity}× {item.item_name}
                  </p>
                ))}
              </div>
              {order.special_instructions && (
                <p className="text-sm italic text-ink-500">{`"${order.special_instructions}"`}</p>
              )}
              <p className="ltr-number text-sm text-ink-500">
                {order.contact_phone} · {order.payment_method}
              </p>
              <OrderActionButtons orderId={order.id} status={order.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
