import { cookies } from "next/headers";
import { locales, type Locale } from "./dictionaries";

const LOCALE_COOKIE = "avas_locale";

export function getLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return (locales as readonly string[]).includes(value ?? "") ? (value as Locale) : "dv";
}

export function setLocaleCookie(locale: Locale) {
  cookies().set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

export { LOCALE_COOKIE };
