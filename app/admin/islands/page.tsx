import { createClient } from "@/lib/supabase/server";
import { AddIslandForm } from "@/components/admin/add-island-form";
import { IslandToggle } from "@/components/admin/island-toggle";

export default async function AdminIslandsPage() {
  const supabase = createClient();
  const { data: islands } = await supabase
    .from("islands")
    .select("id, island_name, island_name_dhivehi, island_delivery_fee, delivery_enabled")
    .order("island_name");

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <h1 className="text-xl font-bold text-ink-900">Islands</h1>
      <AddIslandForm />
      <div className="flex flex-col gap-3">
        {(islands ?? []).map((island) => (
          <div key={island.id} className="flex items-center justify-between gap-3 rounded-card bg-white p-4 shadow-card">
            <div>
              <p className="font-semibold text-ink-900">{island.island_name}</p>
              <p className="text-sm text-ink-500">{island.island_name_dhivehi}</p>
              <p className="ltr-number text-sm text-ink-500">MVR {island.island_delivery_fee.toFixed(2)}</p>
            </div>
            <IslandToggle islandId={island.id} enabled={island.delivery_enabled} />
          </div>
        ))}
      </div>
    </div>
  );
}
