import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import type { BusinessCard as BusinessCardType } from "@/lib/services/catalog";
import type { Locale } from "@/lib/i18n/dictionaries";
import { t } from "@/lib/i18n/dictionaries";

export function BusinessCard({ business, locale }: { business: BusinessCardType; locale: Locale }) {
  const strings = t(locale);
  const name = locale === "dv" && business.name_dhivehi ? business.name_dhivehi : business.name;
  const href = business.business_type === "restaurant" ? `/restaurants/${business.id}` : `/businesses/${business.id}`;

  return (
    <Link
      href={href}
      className="flex w-full shrink-0 flex-col overflow-hidden rounded-card bg-white shadow-card"
    >
      <div className="relative h-32 w-full bg-sand-200">
        {business.cover_image_url ? (
          <Image src={business.cover_image_url} alt="" fill className="object-cover" sizes="320px" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">🍽️</div>
        )}
        {!business.is_open && (
          <span className="absolute left-2 top-2 rounded-pill bg-ink-900/80 px-2 py-0.5 text-xs font-semibold text-white">
            {strings.business.closed}
          </span>
        )}
        {business.is_featured && business.is_open && (
          <span className="absolute left-2 top-2 rounded-pill bg-coral-500 px-2 py-0.5 text-xs font-semibold text-white">
            ★
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="truncate font-semibold text-ink-900">{name}</p>
        <div className="flex items-center gap-1 text-sm text-ink-500">
          <Star size={14} className="fill-lagoon-500 text-lagoon-500" />
          <span>{business.rating_count > 0 ? business.rating_average.toFixed(1) : "—"}</span>
          <span aria-hidden="true">·</span>
          <span className="ltr-number">
            {strings.business.minutesEstimate.replace("{min}", String(business.estimated_prep_minutes))}
          </span>
        </div>
        <p className="ltr-number text-sm text-ink-500">
          {strings.business.deliveryFee}: {strings.common.currency} {business.delivery_fee.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}
