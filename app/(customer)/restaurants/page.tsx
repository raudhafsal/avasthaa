import Link from "next/link";
import { clsx } from "clsx";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getBusinesses, getCategories } from "@/lib/services/catalog";
import { BusinessCard } from "@/components/customer/business-card";

export default async function RestaurantsPage({
  searchParams,
}: {
  searchParams: { category?: string; sort?: string; open?: string };
}) {
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

  const sort = searchParams.sort === "rating" || searchParams.sort === "delivery_fee" ? searchParams.sort : undefined;

  const [categories, businesses] = await Promise.all([
    getCategories(),
    getBusinesses({
      islandId: profile?.island_id,
      kind: "restaurant",
      categoryId: searchParams.category,
      openNow: searchParams.open === "1",
      sort,
    }),
  ]);

  function filterHref(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams({
      ...(searchParams.category ? { category: searchParams.category } : {}),
      ...(searchParams.sort ? { sort: searchParams.sort } : {}),
      ...(searchParams.open ? { open: searchParams.open } : {}),
      ...patch,
    });
    for (const [key, value] of Array.from(params.entries())) {
      if (!value) params.delete(key);
    }
    const query = params.toString();
    return query ? `/restaurants?${query}` : "/restaurants";
  }

  const chips = [
    { key: "rating", label: strings.business.filters.rating, active: searchParams.sort === "rating", href: filterHref({ sort: searchParams.sort === "rating" ? undefined : "rating" }) },
    { key: "delivery_fee", label: strings.business.filters.deliveryFee, active: searchParams.sort === "delivery_fee", href: filterHref({ sort: searchParams.sort === "delivery_fee" ? undefined : "delivery_fee" }) },
    { key: "open", label: strings.business.filters.openNow, active: searchParams.open === "1", href: filterHref({ open: searchParams.open === "1" ? undefined : "1" }) },
  ];

  return (
    <div className="flex flex-col gap-4 px-4 pt-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={filterHref({ category: searchParams.category === category.id ? undefined : category.id })}
            className={clsx(
              "shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium",
              searchParams.category === category.id
                ? "border-ocean-900 bg-ocean-900 text-white"
                : "border-sand-200 bg-white text-ink-700",
            )}
          >
            {locale === "dv" ? category.name_dhivehi : category.name}
          </Link>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {chips.map((chip) => (
          <Link
            key={chip.key}
            href={chip.href}
            className={clsx(
              "shrink-0 rounded-pill border px-3 py-1.5 text-sm font-medium",
              chip.active ? "border-lagoon-600 bg-lagoon-500 text-white" : "border-sand-200 bg-white text-ink-700",
            )}
          >
            {chip.label}
          </Link>
        ))}
      </div>

      {businesses.length === 0 ? (
        <div className="mt-8 rounded-card bg-white p-6 text-center shadow-card">
          <p className="font-medium text-ink-700">{strings.home.noResults}</p>
          <p className="mt-1 text-sm text-ink-500">{strings.home.noResultsHint}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {businesses.map((business) => (
            <BusinessCard key={business.id} business={business} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
