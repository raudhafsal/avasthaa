"use client";

import { useState, useTransition } from "react";
import { verifyBankTransfer } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";

export function PaymentVerifyButtons({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  function run(approve: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await verifyBankTransfer(paymentId, approve, approve ? null : note);
      if (result.error) setError(result.error);
      else setDone(approve ? "approved" : "rejected");
    });
  }

  if (done) {
    return (
      <p className={done === "approved" ? "text-sm font-medium text-lagoon-600" : "text-sm font-medium text-coral-600"}>
        {done === "approved" ? "Approved ✓" : "Rejected"}
      </p>
    );
  }

  if (showReject) {
    return (
      <div className="flex flex-col gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason (shown to customer)"
          className="min-h-touch rounded-2xl border border-sand-200 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <Button variant="ghost" disabled={isPending} onClick={() => setShowReject(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={isPending || !note.trim()} onClick={() => run(false)}>
            Confirm reject
          </Button>
        </div>
        {error && <p className="text-sm text-coral-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button variant="danger" disabled={isPending} onClick={() => setShowReject(true)}>
          Reject
        </Button>
        <Button disabled={isPending} onClick={() => run(true)}>
          Approve
        </Button>
      </div>
      {error && <p className="text-sm text-coral-600">{error}</p>}
    </div>
  );
}
