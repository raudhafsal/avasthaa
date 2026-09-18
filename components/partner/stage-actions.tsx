"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceDeliveryStage, completeDeliveryWithOtp } from "@/lib/actions/partner";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";

const NEXT_STAGE: Record<string, { label: string; stage: string } | undefined> = {
  awaiting_pickup: { label: "Confirm pickup", stage: "picked_up" },
  awaiting_boat: { label: "Boat departed", stage: "in_transit_boat" },
  in_transit_boat: { label: "Arrived at destination island", stage: "arrived_destination" },
  arrived_destination: { label: "Start delivery", stage: "out_for_delivery" },
};

export function StageActions({
  deliveryId,
  stage,
  requiresBoat,
}: {
  deliveryId: string;
  stage: string;
  requiresBoat: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const router = useRouter();

  function advance(nextStage: string) {
    setError(null);
    startTransition(async () => {
      const result = await advanceDeliveryStage(deliveryId, nextStage);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleOtpSubmit(formData: FormData) {
    setError(null);
    const code = String(formData.get("code") ?? "");
    startTransition(async () => {
      const result = await completeDeliveryWithOtp(deliveryId, code);
      if (result.error) setError(result.error);
      else router.push("/partner");
    });
  }

  if (stage === "picked_up") {
    const nextStage = requiresBoat ? "awaiting_boat" : "out_for_delivery";
    const label = requiresBoat ? "Start boat transfer" : "Start delivery";
    return (
      <div className="flex flex-col gap-2">
        <Button disabled={isPending} onClick={() => advance(nextStage)}>
          {label}
        </Button>
        {error && <p className="text-sm text-coral-600">{error}</p>}
      </div>
    );
  }

  if (stage === "out_for_delivery") {
    return (
      <form action={handleOtpSubmit} className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink-700">Ask the customer for their delivery code</p>
        <OtpInput name="code" error={error ?? undefined} />
        <Button type="submit" disabled={isPending}>
          Confirm delivery
        </Button>
      </form>
    );
  }

  const next = NEXT_STAGE[stage];
  if (!next) return null;

  return (
    <div className="flex flex-col gap-2">
      <Button disabled={isPending} onClick={() => advance(next.stage)}>
        {next.label}
      </Button>
      {error && <p className="text-sm text-coral-600">{error}</p>}
    </div>
  );
}
