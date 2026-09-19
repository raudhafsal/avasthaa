"use client";

import { useFormState } from "react-dom";
import { updateAppSetting } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function AppSettingForm({ settingKey, label, value }: { settingKey: string; label: string; value: unknown }) {
  const [state, formAction] = useFormState(updateAppSetting, {});

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
      <input type="hidden" name="key" value={settingKey} />
      <label htmlFor={settingKey} className="text-sm font-medium text-ink-700">
        {label}
      </label>
      <textarea
        id={settingKey}
        name="value"
        defaultValue={JSON.stringify(value, null, 2)}
        rows={value && typeof value === "object" ? 6 : 2}
        className="rounded-2xl border border-sand-200 bg-white px-4 py-3 font-mono text-xs"
      />
      {state.error && <p className="text-sm text-coral-600">{state.error}</p>}
      {state.success && <p className="text-sm text-lagoon-600">Saved.</p>}
      <Button type="submit" fullWidth={false} className="px-6">
        Save
      </Button>
    </form>
  );
}
