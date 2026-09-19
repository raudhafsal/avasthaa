import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";

export default async function ProfilePage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email, islands(island_name, island_name_dhivehi)")
    .eq("id", user.id)
    .single();

  const island = (profile as any)?.islands;
  const islandLabel = island ? (locale === "dv" ? island.island_name_dhivehi : island.island_name) : null;

  const links = [
    { href: "/wallet", label: "Wallet" },
    { href: "/favorites", label: "Favorites" },
    { href: "/orders", label: "Orders" },
    { href: "/support", label: "Help & support" },
  ];

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
      <div>
        <h1 className="text-xl font-bold text-ink-900">{profile?.full_name}</h1>
        <p className="ltr-number text-sm text-ink-500">{profile?.phone || profile?.email}</p>
        {islandLabel && <p className="text-sm text-ink-500">{islandLabel}</p>}
      </div>

      <LanguageSwitcher current={locale} />

      <div className="flex flex-col overflow-hidden rounded-card bg-white shadow-card">
        {links.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-sand-200" : ""}`}
          >
            <span className="text-ink-900">{link.label}</span>
            <ChevronRight size={18} className="text-ink-300" />
          </Link>
        ))}
      </div>

      <form action={signOut}>
        <Button type="submit" variant="ghost">
          Log out
        </Button>
      </form>
    </div>
  );
}
