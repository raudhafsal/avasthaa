"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { switchLocale } from "@/lib/actions/locale";
import { locales, localeLabel, type Locale } from "@/lib/i18n/dictionaries";
import { clsx } from "clsx";

export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function handleSelect(locale: Locale) {
    if (locale === current) return;
    startTransition(() => {
      switchLocale(locale, pathname);
    });
  }

  return (
    <div
      className="inline-flex items-center gap-1 rounded-pill bg-sand-200 p-1"
      role="group"
      aria-label="Language"
    >
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending}
          onClick={() => handleSelect(locale)}
          aria-pressed={locale === current}
          className={clsx(
            "rounded-pill px-4 py-1.5 text-sm font-medium transition-colors",
            locale === current
              ? "bg-ocean-900 text-white"
              : "text-ink-500 hover:text-ink-900",
          )}
        >
          {localeLabel[locale]}
        </button>
      ))}
    </div>
  );
}
