import { createClient } from "@/lib/supabase/server";
import { PricingForm } from "@/components/admin/pricing-form";
import { PackageSizeFees } from "@/components/admin/package-size-fees";

export default async function AdminPricingPage() {
  const supabase = createClient();
  const [{ data: settings }, { data: fees }] = await Promise.all([
    supabase.from("pricing_settings").select("*").single(),
    supabase.from("package_size_fees").select("*"),
  ]);

  if (!settings) return null;

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Pricing & commission</h1>
      <PricingForm settings={settings} />
      <PackageSizeFees fees={fees ?? []} />
    </div>
  );
}
