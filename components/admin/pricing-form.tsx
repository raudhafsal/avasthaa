"use client";

import { useFormState } from "react-dom";
import { updatePricingSettings } from "@/lib/actions/admin";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface PricingSettings {
  base_delivery_fee: number;
  per_km_fee: number;
  express_fee: number;
  scheduled_fee: number;
  platform_commission_percent: number;
  default_minimum_order: number;
}

export function PricingForm({ settings }: { settings: PricingSettings }) {
  const [state, formAction] = useFormState(updatePricingSettings, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        name="baseDeliveryFee"
        type="number"
        step="0.01"
        min="0"
        label="Base delivery fee (MVR)"
        defaultValue={settings.base_delivery_fee}
        required
      />
      <TextField
        name="perKmFee"
        type="number"
        step="0.01"
        min="0"
        label="Per-km fee (MVR)"
        defaultValue={settings.per_km_fee}
        required
      />
      <TextField
        name="expressFee"
        type="number"
        step="0.01"
        min="0"
        label="Express delivery fee (MVR)"
        defaultValue={settings.express_fee}
        required
      />
      <TextField
        name="scheduledFee"
        type="number"
        step="0.01"
        min="0"
        label="Scheduled delivery fee (MVR)"
        defaultValue={settings.scheduled_fee}
        required
      />
      <TextField
        name="commissionPercent"
        type="number"
        step="0.1"
        min="0"
        max="100"
        label="Platform commission (%)"
        defaultValue={settings.platform_commission_percent}
        required
      />
      <TextField
        name="defaultMinimumOrder"
        type="number"
        step="0.01"
        min="0"
        label="Default minimum order (MVR)"
        defaultValue={settings.default_minimum_order}
        required
      />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      {state.success && <p className="text-sm text-lagoon-600">Saved.</p>}
      <Button type="submit">Save changes</Button>
    </form>
  );
}
