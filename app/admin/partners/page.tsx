import { getAllPartnersForAdmin } from "@/lib/services/admin";
import { updatePartnerApproval } from "@/lib/actions/admin";
import { ApprovalButtons } from "@/components/admin/approval-buttons";

export default async function AdminPartnersPage() {
  const partners = await getAllPartnersForAdmin();

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Delivery partners</h1>
      <div className="flex flex-col gap-3">
        {partners.map((p: any) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-900">{p.profiles?.full_name}</p>
              <span className="text-xs capitalize text-ink-500">{p.vehicle_type}</span>
            </div>
            <p className="ltr-number text-sm text-ink-500">{p.profiles?.phone}</p>
            <ApprovalButtons entityId={p.id} status={p.approval_status} onChange={updatePartnerApproval} />
          </div>
        ))}
        {partners.length === 0 && <p className="mt-8 text-center text-ink-500">No delivery partners yet.</p>}
      </div>
    </div>
  );
}
