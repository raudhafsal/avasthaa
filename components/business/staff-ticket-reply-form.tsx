"use client";

import { useFormState } from "react-dom";
import { sendSupportMessage } from "@/lib/actions/support";
import { Button } from "@/components/ui/button";

export function StaffTicketReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useFormState(sendSupportMessage, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="ticketId" value={ticketId} />
      <textarea
        name="message"
        rows={3}
        placeholder="Type a message…"
        required
        className="rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base"
      />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      <Button type="submit" fullWidth={false} className="self-end px-6">
        Send
      </Button>
    </form>
  );
}
