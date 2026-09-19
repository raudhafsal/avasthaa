"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import Link from "next/link";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { sendLoginOtp, loginWithEmail } from "@/lib/actions/auth";
import { emptyActionState } from "@/lib/action-state";
import { TextField } from "@/components/ui/text-field";
import { Button } from "@/components/ui/button";

export function LoginForm({ locale }: { locale: Locale }) {
  const strings = t(locale);
  const [useEmail, setUseEmail] = useState(false);
  const [phoneState, phoneAction] = useFormState(sendLoginOtp, emptyActionState);
  const [emailState, emailFormAction] = useFormState(loginWithEmail, emptyActionState);

  if (useEmail) {
    return (
      <>
        <form action={emailFormAction} className="flex flex-col gap-5">
          <TextField
            name="email"
            type="email"
            label={strings.login.emailLabel}
            error={emailState.fieldErrors?.email}
            autoComplete="email"
            required
          />
          <TextField
            name="password"
            type="password"
            label={strings.login.passwordLabel}
            error={emailState.fieldErrors?.password}
            autoComplete="current-password"
            required
          />
          {emailState.error && (
            <p role="alert" className="text-sm text-coral-600">
              {emailState.error}
            </p>
          )}
          <Link href="/forgot-password" className="text-sm font-semibold text-ocean-900">
            {strings.login.forgotPassword}
          </Link>
          <Button type="submit">{strings.login.submitEmail}</Button>
        </form>
        <button
          type="button"
          onClick={() => setUseEmail(false)}
          className="text-center text-sm font-semibold text-ocean-900"
        >
          {strings.login.phoneLabel}
        </button>
      </>
    );
  }

  return (
    <>
      <form action={phoneAction} className="flex flex-col gap-5">
        <TextField
          name="phone"
          type="tel"
          inputMode="numeric"
          label={strings.login.phoneLabel}
          leadingText="+960"
          placeholder={strings.login.phonePlaceholder}
          error={
            phoneState.fieldErrors?.phone === "invalid_phone"
              ? strings.login.invalidPhone
              : phoneState.fieldErrors?.phone
          }
          autoComplete="tel-national"
          required
        />
        {phoneState.error && (
          <p role="alert" className="text-sm text-coral-600">
            {phoneState.error}
          </p>
        )}
        <Button type="submit">{strings.login.submit}</Button>
      </form>
      <button
        type="button"
        onClick={() => setUseEmail(true)}
        className="text-center text-sm font-semibold text-ocean-900"
      >
        {strings.login.emailToggle}
      </button>
      <p className="text-center text-sm text-ink-500">
        {strings.login.noAccount}{" "}
        <Link href="/register" className="font-semibold text-ocean-900">
          {strings.login.noAccountCta}
        </Link>
      </p>
    </>
  );
}
