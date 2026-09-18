"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { claimJob } from "@/lib/actions/partner";
import { Button } from "@/components/ui/button";

export function AcceptJobButton({ deliveryId }: { deliveryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleAccept() {
    setError(null);
    startTransition(async () => {
      const result = await claimJob(deliveryId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push("/partner/active");
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button disabled={isPending} onClick={handleAccept}>
        Accept
      </Button>
      {error && <p className="text-sm text-coral-600">{error}</p>}
    </div>
  );
}
