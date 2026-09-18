"use client";

import { useFormState } from "react-dom";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { sendRegisterOtp, emptyActionState } from "@/lib/actions/auth";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function RegisterForm({ locale }: { locale: Locale }) {
  const strings = t(locale);
  const [state, formAction] = useFormState(sendRegisterOtp, emptyActionState);

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5">
        <TextField
          name="fullName"
          label={strings.register.fullNameLabel}
          error={state.fieldErrors?.fullName}
          autoComplete="name"
          required
        />
        <TextField
          name="phone"
          type="tel"
          inputMode="numeric"
          label={strings.register.phoneLabel}
          leadingText="+960"
          placeholder={strings.login.phonePlaceholder}
          error={
            state.fieldErrors?.phone === "invalid_phone"
              ? strings.login.invalidPhone
              : state.fieldErrors?.phone
          }
          autoComplete="tel-national"
          required
        />
        <TextField
          name="email"
          type="email"
          label={strings.register.emailLabel}
          error={state.fieldErrors?.email}
          autoComplete="email"
        />

        {state.error && (
          <p role="alert" className="text-sm text-coral-600">
            {state.error}
          </p>
        )}

        <p className="text-xs text-ink-500">{strings.register.terms}</p>

        <Button type="submit">{strings.register.submit}</Button>
      </form>

      <p className="text-center text-sm text-ink-500">
        {strings.register.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-ocean-900">
          {strings.register.haveAccountCta}
        </Link>
      </p>
    </>
  );
}
