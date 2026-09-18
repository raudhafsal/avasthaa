"use client";

import { useFormState } from "react-dom";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { resetPassword, emptyActionState } from "@/lib/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function ResetPasswordForm({ locale }: { locale: Locale }) {
  const strings = t(locale);
  const [state, formAction] = useFormState(resetPassword, emptyActionState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        name="password"
        type="password"
        label={strings.resetPassword.passwordLabel}
        error={
          state.fieldErrors?.password
            ? strings.resetPassword.tooShort
            : undefined
        }
        autoComplete="new-password"
        required
      />
      <TextField
        name="confirmPassword"
        type="password"
        label={strings.resetPassword.confirmLabel}
        error={
          state.fieldErrors?.confirmPassword === "mismatch"
            ? strings.resetPassword.mismatch
            : state.fieldErrors?.confirmPassword
        }
        autoComplete="new-password"
        required
      />
      {state.error && (
        <p role="alert" className="text-sm text-coral-600">
          {state.error}
        </p>
      )}
      <Button type="submit">{strings.resetPassword.submit}</Button>
    </form>
  );
}
