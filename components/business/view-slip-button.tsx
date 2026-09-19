"use client";

import { useTransition } from "react";
import { getSlipSignedUrl } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";

export function ViewSlipButton({
  slipPath,
  bucket = "payment-slips",
}: {
  slipPath: string;
  bucket?: "payment-slips" | "wallet-topup-slips";
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const signedUrl = await getSlipSignedUrl(slipPath, bucket);
      if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <Button variant="secondary" fullWidth={false} disabled={isPending} onClick={handleClick} className="px-4">
      {isPending ? "Loading…" : "View slip"}
    </Button>
  );
}
