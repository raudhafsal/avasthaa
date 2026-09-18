import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  const locale = getLocale();
  const strings = t(locale);

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-sand-100 px-6 py-10">
      <h1 className="text-2xl font-bold text-ink-900">{strings.login.title}</h1>
      <LoginForm locale={locale} />
    </main>
  );
}
