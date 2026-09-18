"use client";

import { useState, useTransition } from "react";
import { updatePackageSizeFee } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

interface Fee {
  package_size: string;
  fee: number;
}

export function PackageSizeFees({ fees }: { fees: Fee[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fees.map((f) => [f.package_size, String(f.fee)])),
  );
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function save(size: string) {
    setSaved(null);
    startTransition(async () => {
      await updatePackageSizeFee(size, Number(values[size]));
      setSaved(size);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
      <p className="font-semibold text-ink-900">Package size fees</p>
      {fees.map((f) => (
        <div key={f.package_size} className="flex items-center gap-2">
          <span className="w-20 text-sm capitalize text-ink-700">{f.package_size}</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={values[f.package_size]}
            onChange={(e) => setValues((v) => ({ ...v, [f.package_size]: e.target.value }))}
            className="min-h-touch w-24 rounded-2xl border border-sand-200 px-3 py-2 text-sm"
          />
          <Button
            fullWidth={false}
            disabled={isPending}
            onClick={() => save(f.package_size)}
            className="px-4 py-2 text-xs"
          >
            Save
          </Button>
          {saved === f.package_size && <span className="text-xs text-lagoon-600">Saved</span>}
        </div>
      ))}
    </div>
  );
}
