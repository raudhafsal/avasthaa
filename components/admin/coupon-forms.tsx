"use client";

import { useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { createCoupon, toggleCouponActive } from "@/lib/actions/admin";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";

export function CreateCouponForm() {
  const [state, formAction] = useFormState(createCoupon, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} fullWidth={false} className="px-6">
        + Create coupon
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
      <TextField name="code" label="Code" placeholder="SAVE10" required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="discountType" className="text-sm font-medium text-ink-700">
          Discount type
        </label>
        <select
          id="discountType"
          name="discountType"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed amount (MVR)</option>
        </select>
      </div>
      <TextField name="discountValue" type="number" step="0.01" min="0" label="Discount value" required />
      <TextField name="minimumOrder" type="number" step="0.01" min="0" label="Minimum order (MVR)" defaultValue={0} />
      <TextField name="usageLimit" type="number" min="1" label="Total usage limit (optional)" />
      <TextField name="expiresAt" type="date" label="Expires on" required />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

export function CouponActiveToggle({ couponId, active }: { couponId: string; active: boolean }) {
  const [on, setOn] = useState(active);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const next = !on;
        setOn(next);
        startTransition(() => toggleCouponActive(couponId, next));
      }}
      role="switch"
      aria-checked={on}
      className={clsx(
        "rounded-pill px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60",
        on ? "bg-lagoon-500" : "bg-ink-300",
      )}
    >
      {on ? "Active" : "Inactive"}
    </button>
  );
}
