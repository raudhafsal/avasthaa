import { notFound } from "next/navigation";
import { CheckCircle2, Circle } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { SlipUploadForm } from "@/components/customer/slip-upload-form";
import { ReviewForm } from "@/components/customer/review-form";

const ORDER_STEPS: { status: string; labelKey: string }[] = [
  { status: "pending", labelKey: "Order placed" },
  { status: "accepted", labelKey: "Restaurant accepted" },
  { status: "preparing", labelKey: "Preparing" },
  { status: "ready", labelKey: "Ready" },
  { status: "assigned", labelKey: "Delivery partner assigned" },
  { status: "picked_up", labelKey: "Picked up" },
  { status: "in_transit", labelKey: "On the way" },
  { status: "delivered", labelKey: "Delivered" },
];

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { justPlaced?: string };
}) {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_method, business_id, subtotal, delivery_fee, discount_amount, total_amount, created_at, businesses(name, name_dhivehi, estimated_prep_minutes), order_items(id, item_name, quantity, line_total, selected_options)",
    )
    .eq("id", params.id)
    .single();

  if (!order) notFound();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status, slip_path, staff_note")
    .eq("order_id", order.id)
    .eq("provider", "bank_transfer")
    .maybeSingle();

  const { data: delivery } = await supabase
    .from("deliveries")
    .select("id, stage, assigned_partner_id, delivery_partners(profiles(full_name))")
    .eq("order_id", order.id)
    .maybeSingle();

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", order.id)
    .eq("business_id", order.business_id)
    .maybeSingle();

  const businessName =
    locale === "dv" && (order as any).businesses?.name_dhivehi
      ? (order as any).businesses.name_dhivehi
      : (order as any).businesses?.name;

  const isTerminalNonDelivered = order.status === "rejected" || order.status === "cancelled";
  const currentStepIndex = ORDER_STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
      {searchParams.justPlaced === "1" && (
        <div className="rounded-card bg-lagoon-50 p-4 text-center">
          <p className="font-semibold text-lagoon-700">{strings.checkout.orderConfirmedTitle}</p>
          <p className="ltr-number text-sm text-lagoon-600">
            {strings.checkout.orderNumber}: {order.order_number}
          </p>
        </div>
      )}

      <div>
        <h1 className="text-xl font-bold text-ink-900">{businessName}</h1>
        <p className="ltr-number text-sm text-ink-500">{order.order_number}</p>
      </div>

      {order.payment_method === "bank_transfer" && payment && (
        <>
          {!payment.slip_path && payment.status === "pending" && <SlipUploadForm orderId={order.id} />}
          {payment.slip_path && payment.status === "pending" && (
            <div className="rounded-card bg-ocean-50 p-4 text-center">
              <p className="font-medium text-ink-900">Slip submitted — awaiting staff verification.</p>
            </div>
          )}
          {payment.status === "paid" && (
            <div className="rounded-card bg-lagoon-50 p-4 text-center">
              <p className="font-medium text-lagoon-700">Bank transfer verified ✓</p>
            </div>
          )}
          {payment.status === "failed" && (
            <div className="flex flex-col gap-3">
              <div className="rounded-card bg-coral-50 p-4 text-center">
                <p className="font-medium text-coral-700">
                  {payment.staff_note || "Your transfer slip couldn't be verified. Please upload a clearer copy."}
                </p>
              </div>
              <SlipUploadForm orderId={order.id} />
            </div>
          )}
        </>
      )}

      {!isTerminalNonDelivered && (
        <ol className="flex flex-col gap-3">
          {ORDER_STEPS.map((step, i) => {
            const done = i <= currentStepIndex;
            return (
              <li key={step.status} className="flex items-center gap-3">
                {done ? (
                  <CheckCircle2 size={20} className="text-lagoon-500" />
                ) : (
                  <Circle size={20} className="text-ink-300" />
                )}
                <span className={done ? "font-medium text-ink-900" : "text-ink-300"}>{step.labelKey}</span>
              </li>
            );
          })}
        </ol>
      )}

      {isTerminalNonDelivered && (
        <p className="rounded-card bg-coral-50 p-4 text-center font-medium capitalize text-coral-700">
          {order.status}
        </p>
      )}

      <div className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
        {(order.order_items ?? []).map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-ink-900">
              {item.quantity}× {item.item_name}
            </span>
            <span className="ltr-number text-ink-500">
              {strings.common.currency} {item.line_total.toFixed(2)}
            </span>
          </div>
        ))}
        <div className="mt-2 flex flex-col gap-1 border-t border-sand-200 pt-2 text-sm">
          <div className="flex justify-between text-ink-500">
            <span>{strings.cart.subtotal}</span>
            <span className="ltr-number">
              {strings.common.currency} {order.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-ink-500">
            <span>{strings.cart.deliveryFee}</span>
            <span className="ltr-number">
              {strings.common.currency} {order.delivery_fee.toFixed(2)}
            </span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-lagoon-600">
              <span>{strings.cart.discount}</span>
              <span className="ltr-number">
                -{strings.common.currency} {order.discount_amount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-ink-900">
            <span>{strings.cart.total}</span>
            <span className="ltr-number">
              {strings.common.currency} {order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {delivery && (
        <p className="text-center text-sm text-ink-500">
          Delivery status: <span className="font-medium capitalize text-ink-900">{delivery.stage.replace(/_/g, " ")}</span>
        </p>
      )}

      {order.status === "delivered" && !existingReview && (
        <ReviewForm
          orderId={order.id}
          businessId={order.business_id}
          businessName={businessName}
          partnerId={delivery?.assigned_partner_id}
          partnerName={(delivery as any)?.delivery_partners?.profiles?.full_name}
        />
      )}
    </div>
  );
}
