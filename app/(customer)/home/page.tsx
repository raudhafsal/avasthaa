import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getBusinesses } from "@/lib/services/catalog";
import { BusinessCard } from "@/components/customer/business-card";

export default async function HomePage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("island_id")
    .eq("id", user!.id)
    .single();

  const [categories, restaurants, shops] = await Promise.all([
    getCategories(),
    getBusinesses({ islandId: profile?.island_id, kind: "restaurant", sort: "featured", limit: 10 }),
    getBusinesses({ islandId: profile?.island_id, kind: "shop", sort: "featured", limit: 10 }),
  ]);

  return (
    <div className="flex flex-col gap-6 px-4 pt-4">
      <h1 className="text-xl font-bold text-ink-900">{strings.home.whatsNearby}</h1>

      {categories.length > 0 && (
        <section aria-label={strings.home.categories}>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/restaurants?category=${category.id}`}
                className="flex shrink-0 flex-col items-center gap-1.5 rounded-card bg-white px-4 py-3 shadow-card"
              >
                <span className="text-2xl" aria-hidden="true">
                  {category.icon ?? "🛍️"}
                </span>
                <span className="text-xs font-medium text-ink-700">
                  {locale === "dv" ? category.name_dhivehi : category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <BusinessSection
        title={strings.home.nearbyRestaurants}
        seeAllHref="/restaurants"
        seeAllLabel={strings.home.seeAll}
        businesses={restaurants}
        locale={locale}
        emptyTitle={strings.home.noResults}
        emptyHint={strings.home.noResultsHint}
      />

      <BusinessSection
        title={strings.home.shops}
        seeAllHref="/businesses"
        seeAllLabel={strings.home.seeAll}
        businesses={shops}
        locale={locale}
        emptyTitle={strings.home.noResults}
        emptyHint={strings.home.noResultsHint}
      />
    </div>
  );
}

function BusinessSection({
  title,
  seeAllHref,
  seeAllLabel,
  businesses,
  locale,
  emptyTitle,
  emptyHint,
}: {
  title: string;
  seeAllHref: string;
  seeAllLabel: string;
  businesses: Awaited<ReturnType<typeof getBusinesses>>;
  locale: import("@/lib/i18n/dictionaries").Locale;
  emptyTitle: string;
  emptyHint: string;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">{title}</h2>
        {businesses.length > 0 && (
          <Link href={seeAllHref} className="text-sm font-medium text-ocean-900">
            {seeAllLabel}
          </Link>
        )}
      </div>
      {businesses.length === 0 ? (
        <div className="rounded-card bg-white p-6 text-center shadow-card">
          <p className="font-medium text-ink-700">{emptyTitle}</p>
          <p className="mt-1 text-sm text-ink-500">{emptyHint}</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {businesses.map((business) => (
            <div key={business.id} className="w-56 shrink-0">
              <BusinessCard business={business} locale={locale} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
