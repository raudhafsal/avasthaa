import { createClient } from "@/lib/supabase/server";
import { ViewSlipButton } from "@/components/business/view-slip-button";
import { PaymentVerifyButtons } from "@/components/business/payment-verify-buttons";

export default async function BusinessPaymentsPage() {
  const supabase = createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, slip_path, slip_uploaded_at, order_id, orders(order_number, businesses(name))")
    .eq("provider", "bank_transfer")
    .eq("status", "pending")
    .not("slip_path", "is", null)
    .order("slip_uploaded_at", { ascending: true });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Bank transfer verification</h1>

      {(payments ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-500">Nothing waiting on verification.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {(payments ?? []).map((payment: any) => (
            <div key={payment.id} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-ink-900">{payment.orders?.businesses?.name}</p>
                  <p className="ltr-number text-sm text-ink-500">{payment.orders?.order_number}</p>
                </div>
                <p className="ltr-number font-semibold text-ocean-900">MVR {payment.amount.toFixed(2)}</p>
              </div>
              <ViewSlipButton slipPath={payment.slip_path} />
              <PaymentVerifyButtons paymentId={payment.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
