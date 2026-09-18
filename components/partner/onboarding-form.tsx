"use client";

import { useFormState } from "react-dom";
import { completePartnerOnboarding } from "@/lib/actions/partner";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Island {
  id: string;
  island_name: string;
}

export function PartnerOnboardingForm({ islands }: { islands: Island[] }) {
  const [state, formAction] = useFormState(completePartnerOnboarding, {});

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="vehicleType" className="text-sm font-medium text-ink-700">
          Vehicle type
        </label>
        <select
          id="vehicleType"
          name="vehicleType"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="motorcycle">Motorcycle</option>
          <option value="bicycle">Bicycle</option>
          <option value="car">Car</option>
          <option value="pickup">Pickup</option>
          <option value="boat">Boat</option>
          <option value="other">Other</option>
        </select>
      </div>
      <TextField name="vehicleRegistration" label="Vehicle registration (optional)" />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="islandId" className="text-sm font-medium text-ink-700">
          Home island
        </label>
        <select
          id="islandId"
          name="islandId"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="" disabled selected>
            Select your island
          </option>
          {islands.map((island) => (
            <option key={island.id} value={island.id}>
              {island.island_name}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <Button type="submit">Finish setup</Button>
    </form>
  );
}
