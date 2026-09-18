"use client";

import { useFormState } from "react-dom";
import { updatePartnerProfile } from "@/lib/actions/partner";
import { signOut } from "@/lib/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Island {
  id: string;
  island_name: string;
}

interface Partner {
  vehicle_type: string;
  vehicle_registration: string | null;
  island_id: string;
}

export function PartnerProfileForm({ partner, islands }: { partner: Partner; islands: Island[] }) {
  const [state, formAction] = useFormState(updatePartnerProfile, {});

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="vehicleType" className="text-sm font-medium text-ink-700">
            Vehicle type
          </label>
          <select
            id="vehicleType"
            name="vehicleType"
            defaultValue={partner.vehicle_type}
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
        <TextField
          name="vehicleRegistration"
          label="Vehicle registration"
          defaultValue={partner.vehicle_registration ?? ""}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="islandId" className="text-sm font-medium text-ink-700">
            Home island
          </label>
          <select
            id="islandId"
            name="islandId"
            defaultValue={partner.island_id}
            required
            className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
          >
            {islands.map((island) => (
              <option key={island.id} value={island.id}>
                {island.island_name}
              </option>
            ))}
          </select>
        </div>
        {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
        <Button type="submit">Save changes</Button>
      </form>

      <form action={signOut}>
        <Button type="submit" variant="ghost">
          Log out
        </Button>
      </form>
    </div>
  );
}
