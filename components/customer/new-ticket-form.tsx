"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createSupportTicket } from "@/lib/actions/support";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function NewTicketForm() {
  const [state, formAction] = useFormState(createSupportTicket, {});
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="px-6">
        New request
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-ink-700">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        >
          <option value="order">Order issue</option>
          <option value="delivery">Delivery issue</option>
          <option value="payment">Payment issue</option>
          <option value="complaint">Complaint</option>
          <option value="other">Other</option>
        </select>
      </div>
      <TextField name="subject" label="Subject" required />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-ink-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
        />
      </div>
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
