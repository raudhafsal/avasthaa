"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";

const STATUSES = ["approved", "rejected", "suspended"];

export function ApprovalButtons({
  entityId,
  status,
  onChange,
}: {
  entityId: string;
  status: string;
  onChange: (id: string, next: string, old: string) => Promise<{ error?: string }>;
}) {
  const [current, setCurrent] = useState(status);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-1">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          disabled={isPending || s === current}
          onClick={() => {
            const old = current;
            setCurrent(s);
            startTransition(async () => {
              const result = await onChange(entityId, s, old);
              if (result.error) setCurrent(old);
            });
          }}
          className={clsx(
            "rounded-pill px-3 py-1.5 text-xs font-semibold capitalize disabled:opacity-50",
            s === current ? "bg-ocean-900 text-white" : "bg-sand-200 text-ink-700",
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}
