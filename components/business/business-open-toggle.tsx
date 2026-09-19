"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { toggleBusinessOpen } from "@/lib/actions/business-orders";

export function BusinessOpenToggle({ businessId, isOpen }: { businessId: string; isOpen: boolean }) {
  const [open, setOpen] = useState(isOpen);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = !open;
    setOpen(next);
    startTransition(() => {
      toggleBusinessOpen(businessId, next);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      role="switch"
      aria-checked={open}
      className={clsx(
        "flex h-touch shrink-0 items-center rounded-pill px-3 text-xs font-semibold disabled:opacity-60",
        open ? "bg-lagoon-500 text-white" : "bg-ink-300 text-white",
      )}
    >
      {open ? "Open" : "Closed"}
    </button>
  );
}
