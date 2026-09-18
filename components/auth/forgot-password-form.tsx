"use client";

import { useFormState } from "react-dom";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { forgotPassword, emptyActionState } from "@/lib/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const strings = t(locale);
  const [state, formAction] = useFormState(forgotPassword, emptyActionState);

  if (state.success) {
    return <p className="text-ink-700">{strings.forgotPassword.sent}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <p className="text-ink-500">{strings.forgotPassword.subtitle}</p>
      <TextField
        name="email"
        type="email"
        label={strings.forgotPassword.emailLabel}
        error={state.fieldErrors?.email}
        autoComplete="email"
        required
      />
      {state.error && (
        <p role="alert" className="text-sm text-coral-600">
          {state.error}
        </p>
      )}
      <Button type="submit">{strings.forgotPassword.submit}</Button>
    </form>
  );
}
