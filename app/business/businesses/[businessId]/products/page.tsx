import { notFound } from "next/navigation";
import { getBusinessForStaff } from "@/lib/services/business";
import { getShopProducts } from "@/lib/services/catalog";
import { ProductRow } from "@/components/business/product-row";
import { AddProductCategoryForm, AddProductForm } from "@/components/business/product-forms";

export default async function BusinessProductsPage({ params }: { params: { businessId: string } }) {
  const business = await getBusinessForStaff(params.businessId);
  if (!business) notFound();

  const { categories, products } = await getShopProducts(business.id);
  const uncategorized = products.filter((p) => !p.category_id);

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-ink-900">{business.name}</h1>

      <div className="flex flex-wrap gap-4">
        <AddProductCategoryForm businessId={business.id} />
        <AddProductForm businessId={business.id} categories={categories} />
      </div>

      {products.length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No products yet — add your first one above.</p>
      ) : (
        <>
          {uncategorized.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-ink-900">Uncategorized</h2>
              {uncategorized.map((product) => (
                <ProductRow key={product.id} product={product} businessId={business.id} />
              ))}
            </section>
          )}
          {categories.map((category) => {
            const categoryProducts = products.filter((p) => p.category_id === category.id);
            if (categoryProducts.length === 0) return null;
            return (
              <section key={category.id} className="flex flex-col gap-2">
                <h2 className="font-semibold text-ink-900">{category.name}</h2>
                {categoryProducts.map((product) => (
                  <ProductRow key={product.id} product={product} businessId={business.id} />
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
