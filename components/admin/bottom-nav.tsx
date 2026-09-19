"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, Store, Bike, MoreHorizontal } from "lucide-react";
import { clsx } from "clsx";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutGrid },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/businesses", label: "Businesses", icon: Store },
  { href: "/admin/partners", label: "Partners", icon: Bike },
  { href: "/admin/settings", label: "More", icon: MoreHorizontal },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Admin navigation"
    >
      <ul className="mx-auto flex max-w-lg justify-between px-2">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
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
