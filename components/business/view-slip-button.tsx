"use client";

import { useState, useTransition } from "react";
import { getSlipSignedUrl } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";

export function ViewSlipButton({ slipPath }: { slipPath: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const signedUrl = await getSlipSignedUrl(slipPath);
      if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
    });
  }

  return (
    <Button variant="secondary" fullWidth={false} disabled={isPending} onClick={handleClick} className="px-4">
      {isPending ? "Loading…" : "View slip"}
    </Button>
  );
}
