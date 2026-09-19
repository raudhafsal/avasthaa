"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Navigation, Wallet, User } from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/partner", label: "Home", icon: Home },
  { href: "/partner/jobs", label: "Jobs", icon: ClipboardList },
  { href: "/partner/active", label: "Active", icon: Navigation },
  { href: "/partner/earnings", label: "Earnings", icon: Wallet },
  { href: "/partner/profile", label: "Profile", icon: User },
];

export function PartnerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Partner navigation"
    >
      <ul className="mx-auto flex max-w-lg justify-between px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/partner" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
                  active ? "text-ocean-900" : "text-ink-300",
                )}
              >
                <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
