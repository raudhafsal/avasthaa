import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  const locale = getLocale();
  const strings = t(locale);

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-sand-100 px-6 py-10">
      <h1 className="text-2xl font-bold text-ink-900">{strings.forgotPassword.title}</h1>
      <ForgotPasswordForm locale={locale} />
    </main>
  );
}
