import { notFound, redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n/dictionaries";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/customer/checkout-form";

export default async function CheckoutPage({ searchParams }: { searchParams: { cart?: string } }) {
  const locale = getLocale();
  const strings = t(locale);
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!searchParams.cart) redirect("/cart");

  const [{ data: cart }, { data: addresses }, { data: profile }, { data: bankSetting }] = await Promise.all([
    supabase
      .from("carts")
      .select("id, profile_id, businesses(name, name_dhivehi)")
      .eq("id", searchParams.cart)
      .single(),
    supabase
      .from("addresses")
      .select("id, label, address_line")
      .eq("profile_id", user!.id)
      .order("is_default", { ascending: false }),
    supabase.from("profiles").select("phone").eq("id", user!.id).single(),
    supabase.from("app_settings").select("value").eq("key", "bank_transfer_details").maybeSingle(),
  ]);

  if (!cart || cart.profile_id !== user!.id) notFound();

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">{strings.checkout.title}</h1>
      <CheckoutForm
        locale={locale}
        cartId={cart.id}
        addresses={addresses ?? []}
        defaultPhone={profile?.phone ?? ""}
        bankDetails={bankSetting?.value ?? null}
      />
    </div>
  );
}
