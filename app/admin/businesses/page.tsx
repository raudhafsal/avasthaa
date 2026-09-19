import { getAllBusinessesForAdmin } from "@/lib/services/admin";
import { updateBusinessApproval } from "@/lib/actions/admin";
import { ApprovalButtons } from "@/components/admin/approval-buttons";

export default async function AdminBusinessesPage() {
  const businesses = await getAllBusinessesForAdmin();

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Businesses</h1>
      <div className="flex flex-col gap-3">
        {businesses.map((b) => (
          <div key={b.id} className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-900">{b.name}</p>
              <span className="text-xs capitalize text-ink-500">{b.business_type}</span>
            </div>
            <ApprovalButtons entityId={b.id} status={b.approval_status} onChange={updateBusinessApproval} />
          </div>
        ))}
        {businesses.length === 0 && <p className="mt-8 text-center text-ink-500">No businesses yet.</p>}
      </div>
    </div>
  );
}
