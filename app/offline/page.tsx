export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-sand-100 px-6 text-center">
      <h1 className="text-xl font-semibold text-ink-900">You&rsquo;re offline</h1>
      <p className="max-w-xs text-ink-500">
        Avas Thaa needs a connection to show restaurants, shops, and live
        order updates. Reconnect and try again.
      </p>
    </main>
  );
}
