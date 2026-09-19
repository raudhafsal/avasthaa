"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/lib/actions/push";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function bufferToBase64Url(buffer: ArrayBuffer | null) {
  if (!buffer) return "";
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function PushOptInBanner() {
  const [status, setStatus] = useState<"unsupported" | "default" | "granted" | "denied" | "subscribed">("default");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "default"))
      .catch(() => setStatus("default"));
  }, []);

  async function handleEnable() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    setIsPending(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "default");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      await savePushSubscription(
        json.endpoint!,
        bufferToBase64Url(subscription.getKey("p256dh")),
        bufferToBase64Url(subscription.getKey("auth")),
      );
      setStatus("subscribed");
    } finally {
      setIsPending(false);
    }
  }

  if (status === "unsupported" || status === "subscribed" || status === "denied") return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-card bg-ocean-50 p-4">
      <p className="text-sm text-ink-700">Get notified when your order status changes.</p>
      <Button fullWidth={false} disabled={isPending} onClick={handleEnable} className="shrink-0 px-4">
        Enable
      </Button>
    </div>
  );
}
