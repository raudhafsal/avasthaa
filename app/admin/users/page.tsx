import { searchUsers } from "@/lib/services/admin";
import { UserStatusButtons } from "@/components/admin/user-status-buttons";

const ROLES = ["customer", "staff", "delivery_partner", "administrator", "super_administrator"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string; role?: string };
}) {
  const users = await searchUsers({ query: searchParams.q, role: searchParams.role });

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Users</h1>

      <form method="get" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search name, phone, email"
          className="min-h-touch flex-1 rounded-2xl border border-sand-200 bg-white px-4 py-2 text-sm"
        />
        <button type="submit" className="rounded-pill bg-ocean-900 px-4 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {ROLES.map((role) => (
          <a
            key={role}
            href={`/admin/users?role=${searchParams.role === role ? "" : role}`}
            className={`shrink-0 rounded-pill border px-3 py-1.5 text-xs font-medium capitalize ${
              searchParams.role === role ? "border-ocean-900 bg-ocean-900 text-white" : "border-sand-200 bg-white text-ink-700"
            }`}
          >
            {role.replace("_", " ")}
          </a>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <div key={u.id} className="flex flex-col gap-2 rounded-card bg-white p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-ink-900">{u.full_name}</p>
              <span className="text-xs capitalize text-ink-500">{u.role.replace("_", " ")}</span>
            </div>
            <p className="ltr-number text-sm text-ink-500">{u.phone || u.email}</p>
            <UserStatusButtons userId={u.id} status={u.account_status} />
          </div>
        ))}
        {users.length === 0 && <p className="mt-8 text-center text-ink-500">No users found.</p>}
      </div>
    </div>
  );
}
