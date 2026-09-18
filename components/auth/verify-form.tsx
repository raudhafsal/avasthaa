"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { t, type Locale } from "@/lib/i18n/dictionaries";
import { verifyOtp, resendOtp, emptyActionState } from "@/lib/actions/auth";
import { OtpInput } from "@/components/ui/otp-input";
import { Button } from "@/components/ui/button";

const RESEND_COOLDOWN_SECONDS = 30;

export function VerifyForm({ locale, phone }: { locale: Locale; phone: string }) {
  const strings = t(locale);
  const [state, formAction] = useFormState(verifyOtp, emptyActionState);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    setResendStatus("sending");
    const result = await resendOtp(phone);
    setResendStatus(result.success ? "sent" : "idle");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="phone" value={phone} />
      <p className="text-ink-500">
        {strings.verify.subtitle} <span className="ltr-number font-semibold text-ink-900">+960{phone}</span>
      </p>

      <OtpInput name="code" error={state.error} />

      <Button type="submit">{strings.verify.submit}</Button>

      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || resendStatus === "sending"}
        className="text-center text-sm font-semibold text-ocean-900 disabled:text-ink-300"
      >
        {cooldown > 0
          ? strings.verify.resendIn.replace("{seconds}", String(cooldown))
          : strings.verify.resend}
      </button>
    </form>
  );
}
