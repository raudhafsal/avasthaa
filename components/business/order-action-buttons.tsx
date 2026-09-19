"use client";

import { useState, useTransition } from "react";
import { acceptOrder, rejectOrder, markPreparing, markReady } from "@/lib/actions/business-orders";
import { Button } from "@/components/ui/button";

export function OrderActionButtons({ orderId, status }: { orderId: string; status: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [reason, setReason] = useState("");

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  if (status === "pending") {
    if (showRejectReason) {
      return (
        <div className="flex flex-col gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejecting"
            className="min-h-touch rounded-2xl border border-sand-200 px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowRejectReason(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isPending || !reason.trim()}
              onClick={() => run(() => rejectOrder(orderId, reason))}
            >
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
          <Button variant="danger" disabled={isPending} onClick={() => setShowRejectReason(true)}>
            Reject
          </Button>
          <Button disabled={isPending} onClick={() => run(() => acceptOrder(orderId))}>
            Accept
          </Button>
        </div>
        {error && <p className="text-sm text-coral-600">{error}</p>}
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <div className="flex flex-col gap-2">
        <Button disabled={isPending} onClick={() => run(() => markPreparing(orderId))}>
          Start preparing
        </Button>
        {error && <p className="text-sm text-coral-600">{error}</p>}
      </div>
    );
  }

  if (status === "preparing") {
    return (
      <div className="flex flex-col gap-2">
        <Button disabled={isPending} onClick={() => run(() => markReady(orderId))}>
          Mark ready for pickup
        </Button>
        {error && <p className="text-sm text-coral-600">{error}</p>}
      </div>
    );
  }

  if (status === "ready") {
    return <p className="text-sm font-medium text-lagoon-600">Waiting for a delivery partner…</p>;
  }

  return null;
}
