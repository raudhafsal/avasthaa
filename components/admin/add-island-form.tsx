"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createIsland } from "@/lib/actions/admin";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function AddIslandForm() {
  const [state, formAction] = useFormState(createIsland, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} fullWidth={false} className="px-6">
        + Add island
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
      <TextField name="islandName" label="Island name (English)" required />
      <TextField name="islandNameDhivehi" label="Island name (Dhivehi)" required />
      <TextField name="islandFee" type="number" step="0.01" min="0" label="Island delivery fee (MVR)" defaultValue={0} />
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
