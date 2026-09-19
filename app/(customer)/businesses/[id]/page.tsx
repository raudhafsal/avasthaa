import { notFound } from "next/navigation";
import Image from "next/image";
import { Star } from "lucide-react";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { getBusinessById, getShopProducts } from "@/lib/services/catalog";
import { ProductCard } from "@/components/customer/product-card";
import { FavoriteButton } from "@/components/customer/favorite-button";

export default async function ShopPage({ params }: { params: { id: string } }) {
  const locale = getLocale();
  const strings = t(locale);
  const business = await getBusinessById(params.id);
  if (!business) notFound();

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: favorite } = user
    ? await supabase.from("favorites").select("id").eq("profile_id", user.id).eq("business_id", params.id).maybeSingle()
    : { data: null };

  const { categories, products } = await getShopProducts(params.id);
  const name = locale === "dv" && business.name_dhivehi ? business.name_dhivehi : business.name;

  const uncategorized = products.filter((p) => !p.category_id);
  const grouped = categories
    .map((category) => ({ category, products: products.filter((p) => p.category_id === category.id) }))
    .filter((g) => g.products.length > 0);

  return (
    <div className="flex flex-col gap-5 pb-6">
      <div className="relative h-40 w-full bg-sand-200">
        {business.cover_image_url && (
          <Image src={business.cover_image_url} alt="" fill className="object-cover" sizes="100vw" />
        )}
        {!business.is_open && (
          <span className="absolute left-4 top-4 rounded-pill bg-ink-900/80 px-3 py-1 text-sm font-semibold text-white">
            {strings.business.closed}
          </span>
        )}
        <div className="absolute right-4 top-4">
          <FavoriteButton businessId={business.id} initiallyFavorited={!!favorite} />
        </div>
      </div>

      <div className="flex flex-col gap-2 px-4">
        <h1 className="text-xl font-bold text-ink-900">{name}</h1>
        {business.description && <p className="text-sm text-ink-500">{business.description}</p>}
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-700">
          <span className="flex items-center gap-1">
            <Star size={16} className="fill-lagoon-500 text-lagoon-500" />
            <span className="ltr-number">{business.rating_count > 0 ? business.rating_average.toFixed(1) : "—"}</span>
          </span>
          <span className="ltr-number">
            {strings.business.deliveryFee}: {strings.common.currency} {business.delivery_fee.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-6 px-4">
        {uncategorized.length > 0 && (
          <section className="grid grid-cols-2 gap-3">
            {uncategorized.map((product) => (
              <ProductCard key={product.id} product={product} businessId={business.id} locale={locale} />
            ))}
          </section>
        )}
        {grouped.map(({ category, products: categoryProducts }) => (
          <section key={category.id} className="flex flex-col gap-3">
            <h2 className="font-semibold text-ink-900">
              {locale === "dv" && category.name_dhivehi ? category.name_dhivehi : category.name}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {categoryProducts.map((product) => (
                <ProductCard key={product.id} product={product} businessId={business.id} locale={locale} />
              ))}
            </div>
          </section>
        ))}
        {products.length === 0 && (
          <div className="rounded-card bg-white p-6 text-center shadow-card">
            <p className="font-medium text-ink-700">{strings.home.noResults}</p>
          </div>
        )}
      </div>
    </div>
  );
}
