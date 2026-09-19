import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, User } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/customer/bottom-nav";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { count: cartCount }, { count: unreadCount }] = await Promise.all([
    supabase.from("profiles").select("full_name, island_id, islands(island_name, island_name_dhivehi)").eq("id", user.id).single(),
    supabase
      .from("cart_items")
      .select("id, carts!inner(profile_id)", { count: "exact", head: true })
      .eq("carts.profile_id", user.id),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", user.id)
      .is("read_at", null),
  ]);

  const islandRaw = (profile as { islands?: { island_name: string; island_name_dhivehi: string } | { island_name: string; island_name_dhivehi: string }[] } | null)?.islands;
  const island = Array.isArray(islandRaw) ? islandRaw[0] : islandRaw;
  const islandLabel = island ? (locale === "dv" ? island.island_name_dhivehi : island.island_name) : null;

  return (
    <div className="min-h-dvh bg-sand-100 pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-sand-200 bg-white px-4 py-3">
        <Link href="/home" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-ocean-900 text-sm font-bold text-white">
            AT
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-ink-900">{strings.common.appName}</span>
            {islandLabel && <span className="text-xs text-ink-500">{islandLabel}</span>}
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/notifications"
            aria-label={strings.nav.notifications}
            className="relative flex h-touch w-touch items-center justify-center rounded-full text-ink-700 hover:bg-sand-200"
          >
            <Bell size={20} />
            {!!unreadCount && unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-coral-500" />
            )}
          </Link>
          <Link
            href="/profile"
            aria-label={strings.nav.profile}
            className="flex h-touch w-touch items-center justify-center rounded-full text-ink-700 hover:bg-sand-200"
          >
            <User size={20} />
          </Link>
        </div>
      </header>

      <main>{children}</main>

      <BottomNav labels={strings.nav} cartCount={cartCount ?? 0} unreadCount={unreadCount ?? 0} />
    </div>
  );
}
