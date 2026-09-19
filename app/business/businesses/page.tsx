import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllBusinesses } from "@/lib/services/business";
import { CreateBusinessForm } from "@/components/business/create-business-form";
import { BusinessOpenToggle } from "@/components/business/business-open-toggle";

export default async function BusinessesPage() {
  const supabase = createClient();
  const [businesses, { data: islands }] = await Promise.all([
    getAllBusinesses(),
    supabase.from("islands").select("id, island_name").order("island_name"),
  ]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <CreateBusinessForm islands={islands ?? []} />

      {businesses.length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No businesses yet — add the first one above.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {businesses.map((business) => (
            <div key={business.id} className="flex items-center justify-between gap-3 rounded-card bg-white p-4 shadow-card">
              <Link href={`/business/businesses/${business.id}/settings`} className="flex-1">
                <p className="font-semibold text-ink-900">{business.name}</p>
                <p className="text-sm capitalize text-ink-500">{business.business_type}</p>
              </Link>
              <Link
                href={
                  business.business_type === "restaurant"
                    ? `/business/businesses/${business.id}/menu`
                    : `/business/businesses/${business.id}/products`
                }
                className="rounded-pill border border-sand-200 px-3 py-2 text-sm font-medium text-ocean-900"
              >
                {business.business_type === "restaurant" ? "Menu" : "Products"}
              </Link>
              <BusinessOpenToggle businessId={business.id} isOpen={business.is_open} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
