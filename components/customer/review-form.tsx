"use client";

import { useFormState } from "react-dom";
import { submitReview } from "@/lib/actions/reviews";
import { StarRatingInput } from "@/components/customer/star-rating-input";
import { Button } from "@/components/ui/button";

export function ReviewForm({
  orderId,
  businessId,
  businessName,
  partnerId,
  partnerName,
}: {
  orderId: string;
  businessId: string;
  businessName: string;
  partnerId?: string | null;
  partnerName?: string | null;
}) {
  const [state, formAction] = useFormState(submitReview, {});

  if (state.success) {
    return (
      <div className="rounded-card bg-lagoon-50 p-4 text-center">
        <p className="font-medium text-lagoon-700">Thanks for your feedback!</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-white p-4 shadow-card">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="businessId" value={businessId} />
      <p className="font-semibold text-ink-900">Rate your order</p>
      <StarRatingInput name="businessRating" label={businessName} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessComment" className="text-sm font-medium text-ink-700">
          Comment (optional)
        </label>
        <textarea
          id="businessComment"
          name="businessComment"
          rows={2}
          className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-sm"
        />
      </div>
      {partnerId && (
        <>
          <input type="hidden" name="partnerId" value={partnerId} />
          <StarRatingInput name="partnerRating" label={partnerName ?? "Delivery partner"} />
        </>
      )}
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <Button type="submit">Submit review</Button>
    </form>
  );
}
