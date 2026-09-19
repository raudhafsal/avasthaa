"use client";

import { useState, useTransition } from "react";
import { updateUserRole } from "@/lib/actions/admin";

const ROLES = ["customer", "staff", "delivery_partner", "administrator", "super_administrator"];

export function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const [current, setCurrent] = useState(role);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <select
        value={current}
        disabled={isPending}
        onChange={(e) => {
          const old = current;
          const next = e.target.value;
          setCurrent(next);
          setError(null);
          startTransition(async () => {
            const result = await updateUserRole(userId, next, old);
            if (result.error) {
              setCurrent(old);
              setError(result.error);
            }
          });
        }}
        className="min-h-touch rounded-2xl border border-sand-200 bg-white px-3 py-2 text-sm capitalize disabled:opacity-60"
      >
        {ROLES.map((r) => (
          <option key={r} value={r} className="capitalize">
            {r.replace("_", " ")}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-coral-600">{error}</p>}
    </div>
  );
}
