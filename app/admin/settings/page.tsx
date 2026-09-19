import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppSettingForm } from "@/components/admin/app-setting-form";

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data: settings } = await supabase.from("app_settings").select("key, value");
  const byKey = Object.fromEntries((settings ?? []).map((s) => [s.key, s.value]));

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Settings</h1>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/islands" className="rounded-pill border border-sand-200 bg-white px-4 py-2 text-sm font-medium text-ocean-900">
          Islands
        </Link>
        <Link href="/admin/pricing" className="rounded-pill border border-sand-200 bg-white px-4 py-2 text-sm font-medium text-ocean-900">
          Pricing
        </Link>
        <Link href="/admin/coupons" className="rounded-pill border border-sand-200 bg-white px-4 py-2 text-sm font-medium text-ocean-900">
          Coupons
        </Link>
        <Link href="/admin/audit-log" className="rounded-pill border border-sand-200 bg-white px-4 py-2 text-sm font-medium text-ocean-900">
          Audit log
        </Link>
      </div>

      <AppSettingForm settingKey="app_name" label="App name" value={byKey.app_name ?? ""} />
      <AppSettingForm settingKey="support_phone" label="Support phone" value={byKey.support_phone ?? ""} />
      <AppSettingForm settingKey="support_email" label="Support email" value={byKey.support_email ?? ""} />
      <AppSettingForm
        settingKey="bank_transfer_details"
        label="Bank transfer details (shown to customers at checkout)"
        value={byKey.bank_transfer_details ?? {}}
      />
      <AppSettingForm settingKey="legal_pages" label="Legal pages" value={byKey.legal_pages ?? {}} />
    </div>
  );
}
