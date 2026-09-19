"use client";

import { useState, useTransition } from "react";
import { clsx } from "clsx";
import { updateTicketStatus, assignTicketToSelf } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";

const STATUSES = ["open", "in_progress", "resolved", "closed"];

export function TicketControls({
  ticketId,
  status,
  assignedStaffId,
  currentStaffId,
}: {
  ticketId: string;
  status: string;
  assignedStaffId: string | null;
  currentStaffId: string;
}) {
  const [current, setCurrent] = useState(status);
  const [assigned, setAssigned] = useState(assignedStaffId === currentStaffId);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {!assigned && (
        <Button
          fullWidth={false}
          disabled={isPending}
          onClick={() => {
            setAssigned(true);
            startTransition(() => assignTicketToSelf(ticketId));
          }}
          className="self-start px-4"
        >
          Assign to me
        </Button>
      )}
      <div className="flex flex-wrap gap-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={isPending || s === current}
            onClick={() => {
              setCurrent(s);
              startTransition(() => updateTicketStatus(ticketId, s));
            }}
            className={clsx(
              "rounded-pill px-3 py-1.5 text-xs font-semibold capitalize disabled:opacity-50",
              s === current ? "bg-ocean-900 text-white" : "bg-sand-200 text-ink-700",
            )}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>
    </div>
  );
}
