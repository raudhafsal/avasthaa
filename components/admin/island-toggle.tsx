"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { toggleIslandDeliveryEnabled } from "@/lib/actions/admin";

export function IslandToggle({ islandId, enabled }: { islandId: string; enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(() => toggleIslandDeliveryEnabled(islandId, next));
      }}
      role="switch"
      aria-checked={on}
      className={clsx(
        "rounded-pill px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60",
        on ? "bg-lagoon-500" : "bg-ink-300",
      )}
    >
      {on ? "Delivery on" : "Delivery off"}
    </button>
  );
}
