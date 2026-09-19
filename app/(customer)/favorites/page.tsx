import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { BusinessCard } from "@/components/customer/business-card";

export default async function FavoritesPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: favorites } = await supabase
    .from("favorites")
    .select(
      "id, businesses(id, name, name_dhivehi, business_type, logo_url, cover_image_url, delivery_fee, minimum_order, estimated_prep_minutes, is_open, is_featured, rating_average, rating_count)",
    )
    .eq("profile_id", user.id)
    .not("business_id", "is", null);

  const businesses = (favorites ?? []).map((f: any) => f.businesses).filter(Boolean);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Favorites</h1>

      {businesses.length === 0 ? (
        <div className="mt-8 rounded-card bg-white p-6 text-center shadow-card">
          <p className="font-medium text-ink-700">{strings.home.noResults}</p>
          <p className="mt-1 text-sm text-ink-500">Tap the heart on a restaurant or shop to save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {businesses.map((business: any) => (
            <BusinessCard key={business.id} business={business} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
