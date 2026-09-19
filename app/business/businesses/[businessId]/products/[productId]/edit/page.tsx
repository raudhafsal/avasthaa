import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBusinessForStaff } from "@/lib/services/business";
import { EditProductForm } from "@/components/business/edit-product-form";

export default async function EditProductPage({
  params,
}: {
  params: { businessId: string; productId: string };
}) {
  const business = await getBusinessForStaff(params.businessId);
  if (!business) notFound();

  const supabase = createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price, sale_price, description, image_url, sku, stock_quantity, category_id, business_id")
      .eq("id", params.productId)
      .eq("business_id", business.id)
      .single(),
    supabase.from("product_categories").select("id, name").eq("business_id", business.id).order("sort_order"),
  ]);

  if (!product) notFound();

  return (
    <div className="px-4 pt-4 pb-10">
      <h1 className="mb-4 text-xl font-bold text-ink-900">Edit product</h1>
      <EditProductForm product={product} businessId={business.id} categories={categories ?? []} />
    </div>
  );
}
