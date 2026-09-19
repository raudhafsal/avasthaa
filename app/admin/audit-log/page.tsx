import { getAuditLog } from "@/lib/services/admin";

export default async function AdminAuditLogPage() {
  const logs = await getAuditLog(100);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Audit log</h1>
      <div className="flex flex-col gap-2">
        {logs.map((log: any) => (
          <div key={log.id} className="rounded-card bg-white p-3 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-ink-900">{log.action}</span>
              <span className="text-xs text-ink-500">{new Date(log.created_at).toLocaleString()}</span>
            </div>
            <p className="text-xs text-ink-500">
              by {log.profiles?.full_name ?? log.admin_id} · {log.entity_type}
            </p>
            {log.new_value && (
              <pre className="mt-1 overflow-x-auto rounded-xl bg-sand-100 p-2 text-xs text-ink-700">
                {JSON.stringify(log.new_value, null, 2)}
              </pre>
            )}
          </div>
        ))}
        {logs.length === 0 && <p className="mt-8 text-center text-ink-500">No admin actions logged yet.</p>}
      </div>
    </div>
  );
}
