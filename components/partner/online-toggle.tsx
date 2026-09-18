"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { toggleOnline } from "@/lib/actions/partner";

export function PartnerOnlineToggle({ isOnline }: { isOnline: boolean }) {
  const [online, setOnline] = useState(isOnline);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !online;
    setOnline(next);
    startTransition(() => {
      toggleOnline(next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      role="switch"
      aria-checked={online}
      className={clsx(
        "flex min-h-touch w-full items-center justify-center gap-2 rounded-pill px-6 py-3 text-base font-semibold text-white disabled:opacity-60",
        online ? "bg-lagoon-500" : "bg-ink-300",
      )}
    >
      <span className={clsx("h-2.5 w-2.5 rounded-full", online ? "bg-white" : "bg-white/70")} />
      {online ? "Online — receiving jobs" : "Offline"}
    </button>
  );
}
