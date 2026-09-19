"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { requestWalletTopup } from "@/lib/actions/wallet";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function WalletTopupForm() {
  const [state, formAction] = useFormState(requestWalletTopup, {});
  const [open, setOpen] = useState(false);

  if (state.success) {
    return (
      <div className="rounded-card bg-lagoon-50 p-4 text-center">
        <p className="font-medium text-lagoon-700">Top-up request submitted — awaiting staff verification.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="px-6">
        Top up wallet
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
      <TextField name="amount" type="number" step="0.01" min="1" label="Amount (MVR)" required />
      <label htmlFor="slip" className="text-sm font-medium text-ink-700">
        Upload your bank transfer slip
      </label>
      <input
        id="slip"
        name="slip"
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required
        className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm"
      />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
}
