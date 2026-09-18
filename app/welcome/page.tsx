import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function WelcomePage() {
  const locale = getLocale();
  const strings = t(locale);

  return (
    <main className="flex min-h-dvh flex-col justify-between bg-ocean-900 px-6 pb-10 pt-16 text-white">
      <div className="flex justify-center">
        <LanguageSwitcher current={locale} />
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-card bg-white/10 text-3xl font-bold">
          AT
        </div>
        <h1 className="text-3xl font-bold">{strings.common.appName}</h1>
        <p className="max-w-xs text-ocean-100">{strings.welcome.tagline}</p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/register"
          className="min-h-touch flex items-center justify-center rounded-pill bg-coral-500 px-6 py-3 text-center text-base font-semibold text-white hover:bg-coral-600"
        >
          {strings.welcome.register}
        </Link>
        <Link
          href="/login"
          className="min-h-touch flex items-center justify-center rounded-pill bg-white/10 px-6 py-3 text-center text-base font-semibold text-white hover:bg-white/20"
        >
          {strings.welcome.login}
        </Link>
      </div>
    </main>
  );
}
