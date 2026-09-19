import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n/server";
import { NotificationRow } from "@/components/customer/notification-row";
import { PushOptInBanner } from "@/components/customer/push-opt-in-banner";
import { markAllNotificationsRead } from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const locale = getLocale();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, title_dhivehi, body, body_dhivehi, read_at, created_at")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const hasUnread = (notifications ?? []).some((n) => !n.read_at);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink-900">Notifications</h1>
        {hasUnread && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="text-sm font-medium text-ocean-900">
              Mark all read
            </button>
          </form>
        )}
      </div>

      <PushOptInBanner />

      {(notifications ?? []).length === 0 ? (
        <p className="mt-8 text-center text-ink-500">No notifications yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {(notifications ?? []).map((n) => (
            <NotificationRow
              key={n.id}
              id={n.id}
              title={locale === "dv" && n.title_dhivehi ? n.title_dhivehi : n.title}
              body={locale === "dv" && n.body_dhivehi ? n.body_dhivehi : n.body}
              createdAt={n.created_at}
              read={!!n.read_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
