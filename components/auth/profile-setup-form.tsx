"use client";

import { useFormState } from "react-dom";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { completeProfileSetup, emptyActionState } from "@/lib/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

interface IslandOption {
  id: string;
  island_name: string;
  island_name_dhivehi: string;
}

export function ProfileSetupForm({
  locale,
  islands,
  defaultFullName,
}: {
  locale: Locale;
  islands: IslandOption[];
  defaultFullName: string;
}) {
  const strings = t(locale);
  const [state, formAction] = useFormState(completeProfileSetup, emptyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        name="fullName"
        label={strings.register.fullNameLabel}
        defaultValue={defaultFullName}
        error={state.fieldErrors?.fullName}
        required
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="islandId" className="text-sm font-medium text-ink-700">
          {strings.profileSetup.islandLabel}
        </label>
        <select
          id="islandId"
          name="islandId"
          required
          className="min-h-touch rounded-2xl border border-sand-200 bg-white px-4 py-3 text-base text-ink-900 outline-none focus:border-ocean-500"
        >
          <option value="" disabled selected>
            {strings.profileSetup.islandLabel}
          </option>
          {islands.map((island) => (
            <option key={island.id} value={island.id}>
              {locale === "dv" ? island.island_name_dhivehi : island.island_name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.islandId && (
          <p role="alert" className="text-sm text-coral-600">
            {strings.common.required}
          </p>
        )}
      </div>

      <TextField
        name="addressLine"
        label={strings.profileSetup.addressLabel}
        placeholder={strings.profileSetup.addressPlaceholder}
        error={state.fieldErrors?.addressLine}
        required
      />

      {state.error && (
        <p role="alert" className="text-sm text-coral-600">
          {state.error}
        </p>
      )}

      <Button type="submit">{strings.profileSetup.submit}</Button>
    </form>
  );
}
