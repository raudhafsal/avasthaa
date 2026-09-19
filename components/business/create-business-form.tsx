"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createBusiness } from "@/lib/actions/business-settings";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface Island {
  id: string;
  island_name: string;
}

export function CreateBusinessForm({ islands }: { islands: Island[] }) {
  const [state, formAction] = useFormState(createBusiness, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} fullWidth={false} className="px-6">
        + Add business
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-card bg-white p-4 shadow-card">
      <TextField name="name" label="Business name" required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessType" className="text-sm font-medium text-ink-700">
          Type
        </label>
        <select
          id="businessType"
          name="businessType"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="restaurant">Restaurant</option>
          <option value="grocery">Grocery</option>
          <option value="pharmacy">Pharmacy</option>
          <option value="electronics">Electronics</option>
          <option value="clothing">Clothing</option>
          <option value="hardware">Hardware</option>
          <option value="bakery">Bakery</option>
          <option value="cafe">Cafe</option>
          <option value="general_store">General store</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="islandId" className="text-sm font-medium text-ink-700">
          Island
        </label>
        <select
          id="islandId"
          name="islandId"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="" disabled selected>
            Select an island
          </option>
          {islands.map((island) => (
            <option key={island.id} value={island.id}>
              {island.island_name}
            </option>
          ))}
        </select>
      </div>
      <TextField name="phone" type="tel" label="Phone" required />
      <TextField name="address" label="Address" required />
      <TextField name="deliveryFee" type="number" step="0.01" min="0" label="Delivery fee (MVR)" defaultValue={0} />
      <TextField name="minimumOrder" type="number" step="0.01" min="0" label="Minimum order (MVR)" defaultValue={0} />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Create business</Button>
      </div>
    </form>
  );
}
