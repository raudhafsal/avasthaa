import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForStaff } from "@/lib/services/business";
import { EditItemForm } from "@/components/business/edit-item-form";

export default async function EditMenuItemPage({
  params,
}: {
  params: { businessId: string; itemId: string };
}) {
  const business = await getBusinessForStaff(params.businessId);
  if (!business) notFound();

  const supabase = createClient();
  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, price, description, image_url, category_id, preparation_time_minutes, business_id")
      .eq("id", params.itemId)
      .eq("business_id", business.id)
      .single(),
    supabase.from("restaurant_categories").select("id, name").eq("business_id", business.id).order("sort_order"),
  ]);

  if (!item) notFound();

  return (
    <div className="px-4 pt-4 pb-10">
      <h1 className="mb-4 text-xl font-bold text-ink-900">Edit item</h1>
      <EditItemForm item={item} businessId={business.id} categories={categories ?? []} />
    </div>
  );
}
