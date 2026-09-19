import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/server";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:support@example.com";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID keys are not configured");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

/**
 * Sends a web push to every device a profile has subscribed on. Reads
 * push_subscriptions via the service-role client (bypassing RLS) —
 * this is only ever called right after send_notification() has already
 * authorized the underlying notification, and there's no client-facing
 * RLS shape for "staff may read a customer's push endpoint" that isn't
 * redundant with that check. Best-effort throughout: a missing service
 * role key, an expired subscription, or a failed HTTP call should never
 * break the notification flow that triggered this.
 */
export async function sendPushToProfile(profileId: string, title: string, body: string, url?: string) {
  try {
    ensureConfigured();
  } catch {
    // SUPABASE_SERVICE_ROLE_KEY / VAPID keys not set up yet in this
    // environment — push is a nice-to-have on top of in-app
    // notifications, so just skip it silently.
    return;
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return;
  }

  const { data: subscriptions } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth_key")
    .eq("profile_id", profileId);

  if (!subscriptions || subscriptions.length === 0) return;

  const payload = JSON.stringify({ title, body, url: url ?? "/notifications" });

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth_key },
          },
          payload,
        );
      } catch (err: any) {
        // 404/410 means the browser unsubscribed or the subscription
        // expired — clean it up so we stop trying.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}
