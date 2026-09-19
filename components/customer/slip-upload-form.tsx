"use client";

import { useFormState } from "react-dom";
import { uploadPaymentSlip } from "@/lib/actions/payments";
import { Button } from "@/components/ui/button";

export function SlipUploadForm({ orderId }: { orderId: string }) {
  const [state, formAction] = useFormState(uploadPaymentSlip, {});

  if (state.success) {
    return (
      <div className="rounded-card bg-lagoon-50 p-4 text-center">
        <p className="font-medium text-lagoon-700">Slip uploaded — awaiting staff verification.</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
      <input type="hidden" name="orderId" value={orderId} />
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
      <Button type="submit">Upload slip</Button>
    </form>
  );
}
