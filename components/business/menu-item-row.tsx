"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { toggleMenuItemAvailability, deleteMenuItem } from "@/lib/actions/menu";
import { clsx } from "clsx";

export function MenuItemRow({
  item,
  businessId,
}: {
  item: { id: string; name: string; price: number; available: boolean };
  businessId: string;
}) {
  const [available, setAvailable] = useState(item.available);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-white p-3 shadow-card">
      <Link href={`/business/businesses/${businessId}/menu/${item.id}/edit`} className="flex-1">
        <p className="font-medium text-ink-900">{item.name}</p>
        <p className="ltr-number text-sm text-ink-500">MVR {item.price.toFixed(2)}</p>
      </Link>
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const next = !available;
          setAvailable(next);
          startTransition(() => {
            toggleMenuItemAvailability(item.id, businessId, next);
          });
        }}
        role="switch"
        aria-checked={available}
        aria-label="Available"
        className={clsx(
          "flex h-touch items-center rounded-pill px-3 text-xs font-semibold",
          available ? "bg-lagoon-500 text-white" : "bg-ink-300 text-white",
        )}
      >
        {available ? "Available" : "Unavailable"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => deleteMenuItem(item.id, businessId))}
        aria-label="Delete item"
        className="flex h-touch w-touch items-center justify-center rounded-full text-coral-500"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
