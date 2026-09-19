"use server";

import { revalidatePath } from "next/cache";
import { setLocaleCookie } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/dictionaries";

export async function switchLocale(locale: Locale, currentPath: string) {
  setLocaleCookie(locale);
  revalidatePath(currentPath);
}
