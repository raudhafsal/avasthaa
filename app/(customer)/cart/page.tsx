import Link from "next/link";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { CartLineControls } from "@/components/customer/cart-line-controls";

export default async function CartPage() {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: carts } = await supabase
    .from("carts")
    .select(
      "id, business_id, businesses(name, name_dhivehi, delivery_fee, minimum_order), cart_items(id, menu_item_id, product_id, quantity, unit_price, selected_options, menu_items(name, name_dhivehi), products(name, name_dhivehi))",
    )
    .eq("profile_id", user!.id);

  const nonEmptyCarts = (carts ?? []).filter((c: any) => (c.cart_items ?? []).length > 0);

  if (nonEmptyCarts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <p className="text-4xl">🛒</p>
        <p className="font-semibold text-ink-900">{strings.cart.empty}</p>
        <p className="text-sm text-ink-500">{strings.cart.emptyHint}</p>
        <Link
          href="/restaurants"
          className="mt-2 rounded-pill bg-ocean-900 px-6 py-3 font-semibold text-white"
        >
          {strings.cart.browse}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 px-4 pt-4">
      <h1 className="text-xl font-bold text-ink-900">{strings.cart.title}</h1>
      {nonEmptyCarts.map((cart: any) => {
        const business = cart.businesses;
        const businessName = locale === "dv" && business?.name_dhivehi ? business.name_dhivehi : business?.name;
        const subtotal = cart.cart_items.reduce(
          (sum: number, item: any) =>
            sum +
            item.quantity *
              (item.unit_price + (item.selected_options ?? []).reduce((s: number, o: any) => s + o.price_delta, 0)),
          0,
        );
        const deliveryFee = business?.delivery_fee ?? 0;
        const belowMinimum = business?.minimum_order && subtotal < business.minimum_order;

        return (
          <div key={cart.id} className="flex flex-col gap-3 rounded-card bg-white p-4 shadow-card">
            <h2 className="font-semibold text-ink-900">{businessName}</h2>

            <div className="flex flex-col gap-3 divide-y divide-sand-200">
              {cart.cart_items.map((item: any) => {
                const itemName =
                  locale === "dv"
                    ? item.menu_items?.name_dhivehi ?? item.products?.name_dhivehi ?? item.menu_items?.name ?? item.products?.name
                    : item.menu_items?.name ?? item.products?.name;
                const optionsTotal = (item.selected_options ?? []).reduce(
                  (s: number, o: any) => s + o.price_delta,
                  0,
                );
                const lineTotal = item.quantity * (item.unit_price + optionsTotal);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 pt-3 first:pt-0">
                    <div className="flex-1">
                      <p className="font-medium text-ink-900">{itemName}</p>
                      {(item.selected_options ?? []).length > 0 && (
                        <p className="text-xs text-ink-500">
                          {item.selected_options.map((o: any) => o.name).join(", ")}
                        </p>
                      )}
                      <p className="ltr-number text-sm text-ink-500">
                        {strings.common.currency} {lineTotal.toFixed(2)}
                      </p>
                    </div>
                    <CartLineControls cartItemId={item.id} quantity={item.quantity} removeLabel={strings.cart.remove} />
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1 border-t border-sand-200 pt-3 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>{strings.cart.subtotal}</span>
                <span className="ltr-number">
                  {strings.common.currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-ink-500">
                <span>{strings.cart.deliveryFee}</span>
                <span className="ltr-number">
                  {strings.common.currency} {deliveryFee.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-semibold text-ink-900">
                <span>{strings.cart.total}</span>
                <span className="ltr-number">
                  {strings.common.currency} {(subtotal + deliveryFee).toFixed(2)}
                </span>
              </div>
            </div>

            {belowMinimum ? (
              <p className="text-sm text-coral-600">
                {strings.business.minOrder}: {strings.common.currency} {business.minimum_order.toFixed(2)}
              </p>
            ) : (
              <Link
                href={`/checkout?cart=${cart.id}`}
                className="min-h-touch flex items-center justify-center rounded-pill bg-ocean-900 font-semibold text-white"
              >
                {strings.cart.checkout}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
