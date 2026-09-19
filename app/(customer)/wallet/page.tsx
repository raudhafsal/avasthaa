import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WalletTopupForm } from "@/components/customer/wallet-topup-form";

export default async function WalletPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: wallet }, { data: transactions }, { data: topups }] = await Promise.all([
    supabase.from("wallets").select("balance").eq("profile_id", user.id).maybeSingle(),
    supabase
      .from("wallet_transactions")
      .select("id, type, amount, balance_after, description, created_at, wallets!inner(profile_id)")
      .eq("wallets.profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("wallet_topups")
      .select("id, amount, status, created_at")
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const pendingTopups = (topups ?? []).filter((t) => t.status === "pending");

  return (
    <div className="flex flex-col gap-5 px-4 pt-4 pb-10">
      <div className="rounded-card bg-ocean-900 p-5 text-white">
        <p className="text-sm text-ocean-100">Wallet balance</p>
        <p className="ltr-number text-3xl font-bold">MVR {(wallet?.balance ?? 0).toFixed(2)}</p>
      </div>

      <WalletTopupForm />

      {pendingTopups.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-ink-700">Pending top-ups</p>
          {pendingTopups.map((t) => (
            <div key={t.id} className="flex items-center justify-between rounded-card bg-white p-3 shadow-card">
              <span className="ltr-number text-sm text-ink-900">MVR {t.amount.toFixed(2)}</span>
              <span className="text-xs text-ink-500">Awaiting verification</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-ink-700">Transaction history</p>
        {(transactions ?? []).length === 0 ? (
          <p className="text-sm text-ink-500">No transactions yet.</p>
        ) : (
          (transactions ?? []).map((txn: any) => (
            <div key={txn.id} className="flex items-center justify-between rounded-card bg-white p-3 shadow-card">
              <div>
                <p className="text-sm font-medium capitalize text-ink-900">{txn.type}</p>
                <p className="text-xs text-ink-500">{txn.description}</p>
              </div>
              <span
                className={`ltr-number text-sm font-semibold ${
                  txn.type === "credit" || txn.type === "refund" ? "text-lagoon-600" : "text-coral-600"
                }`}
              >
                {txn.type === "credit" || txn.type === "refund" ? "+" : "-"}
                MVR {txn.amount.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
