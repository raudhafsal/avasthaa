import { redirect } from "next/navigation";
import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { VerifyForm } from "@/components/auth/verify-form";

export default function VerifyPage({
  searchParams,
}: {
  searchParams: { phone?: string; mode?: string };
}) {
  const locale = getLocale();
  const strings = t(locale);
  const phone = searchParams.phone;

  if (!phone) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-sand-100 px-6 py-10">
      <h1 className="text-2xl font-bold text-ink-900">{strings.verify.title}</h1>
      <VerifyForm locale={locale} phone={phone} />
      <Link
        href={searchParams.mode === "register" ? "/register" : "/login"}
        className="text-center text-sm text-ink-500 underline"
      >
        {strings.verify.changeNumber}
      </Link>
    </main>
  );
}
