import { notFound } from "next/navigation";
import { getBusinessForStaff } from "@/lib/services/business";
import { getRestaurantMenu } from "@/lib/services/catalog";
import { MenuItemRow } from "@/components/business/menu-item-row";
import { AddCategoryForm, AddItemForm } from "@/components/business/menu-forms";

export default async function BusinessMenuPage({ params }: { params: { businessId: string } }) {
  const business = await getBusinessForStaff(params.businessId);
  if (!business) notFound();

  const { categories, items } = await getRestaurantMenu(business.id);
  const uncategorized = items.filter((i) => !i.category_id);

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-ink-900">{business.name}</h1>

      <div className="flex flex-wrap gap-4">
        <AddCategoryForm businessId={business.id} />
        <AddItemForm businessId={business.id} categories={categories} />
      </div>

      {items.length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No menu items yet — add your first one above.</p>
      ) : (
        <>
          {uncategorized.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="font-semibold text-ink-900">Uncategorized</h2>
              {uncategorized.map((item) => (
                <MenuItemRow key={item.id} item={item} businessId={business.id} />
              ))}
            </section>
          )}
          {categories.map((category) => {
            const categoryItems = items.filter((i) => i.category_id === category.id);
            if (categoryItems.length === 0) return null;
            return (
              <section key={category.id} className="flex flex-col gap-2">
                <h2 className="font-semibold text-ink-900">{category.name}</h2>
                {categoryItems.map((item) => (
                  <MenuItemRow key={item.id} item={item} businessId={business.id} />
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
