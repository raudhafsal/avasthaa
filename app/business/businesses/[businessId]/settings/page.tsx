import { notFound } from "next/navigation";
import { getBusinessForStaff } from "@/lib/services/business";
import { BusinessSettingsForm } from "@/components/business/settings-form";

export default async function BusinessSettingsPage({ params }: { params: { businessId: string } }) {
  const business = await getBusinessForStaff(params.businessId);
  if (!business) notFound();

  return (
    <div className="px-4 pt-4 pb-10">
      <h1 className="mb-4 text-xl font-bold text-ink-900">{business.name}</h1>
      <BusinessSettingsForm business={business} />
    </div>
  );
}
