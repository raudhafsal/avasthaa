"use client";

import { useTransition } from "react";
import { markNotificationRead } from "@/lib/actions/notifications";

export function NotificationRow({
  id,
  title,
  body,
  createdAt,
  read,
}: {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => !read && startTransition(() => markNotificationRead(id))}
      disabled={isPending}
      className={`w-full rounded-card p-4 text-left shadow-card ${read ? "bg-white" : "bg-ocean-50"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-ink-900">{title}</p>
        {!read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-coral-500" />}
      </div>
      <p className="mt-0.5 text-sm text-ink-700">{body}</p>
      <p className="mt-1 text-xs text-ink-500">{new Date(createdAt).toLocaleString()}</p>
    </button>
  );
}
