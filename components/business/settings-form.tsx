"use client";

import { useFormState } from "react-dom";
import { updateBusinessProfile } from "@/lib/actions/business-settings";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Business {
  id: string;
  name: string;
  description: string | null;
  phone: string;
  address: string;
  delivery_fee: number;
  minimum_order: number;
  estimated_prep_minutes: number;
}

export function BusinessSettingsForm({ business }: { business: Business }) {
  const [state, formAction] = useFormState(updateBusinessProfile, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="businessId" value={business.id} />
      <TextField name="name" label="Business name" defaultValue={business.name} required />
      <TextField name="description" label="Description" defaultValue={business.description ?? ""} />
      <TextField name="phone" type="tel" label="Phone" defaultValue={business.phone} required />
      <TextField name="address" label="Address" defaultValue={business.address} required />
      <TextField
        name="deliveryFee"
        type="number"
        step="0.01"
        min="0"
        label="Delivery fee (MVR)"
        defaultValue={business.delivery_fee}
        required
      />
      <TextField
        name="minimumOrder"
        type="number"
        step="0.01"
        min="0"
        label="Minimum order (MVR)"
        defaultValue={business.minimum_order}
        required
      />
      <TextField
        name="estimatedPrepMinutes"
        type="number"
        min="1"
        label="Estimated prep time (minutes)"
        defaultValue={business.estimated_prep_minutes}
        required
      />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      {state.success && <p className="text-sm text-lagoon-600">Saved.</p>}
      <Button type="submit">Save changes</Button>
    </form>
  );
}
