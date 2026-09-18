import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { ProfileSetupForm } from "@/components/auth/profile-setup-form";

export default async function ProfileSetupPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: islands }, { data: profile }] = await Promise.all([
    supabase
      .from("islands")
      .select("id, island_name, island_name_dhivehi")
      .eq("delivery_enabled", true)
      .order("island_name"),
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
  ]);

  return (
    <main className="flex min-h-dvh flex-col gap-6 bg-sand-100 px-6 py-10">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">{strings.profileSetup.title}</h1>
        <p className="mt-1 text-ink-500">{strings.profileSetup.subtitle}</p>
      </div>
      <ProfileSetupForm
        locale={locale}
        islands={islands ?? []}
        defaultFullName={profile?.full_name === "New user" ? "" : profile?.full_name ?? ""}
      />
    </main>
  );
}
