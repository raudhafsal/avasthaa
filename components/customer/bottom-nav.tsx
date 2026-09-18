"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ReceiptText, ShoppingCart, Bell, User } from "lucide-react";
import { clsx } from "clsx";

interface BottomNavProps {
  labels: { home: string; orders: string; cart: string; notifications: string; profile: string };
  cartCount: number;
  unreadCount: number;
}

export function BottomNav({ labels, cartCount, unreadCount }: BottomNavProps) {
  const pathname = usePathname();

  const items = [
    { href: "/home", label: labels.home, icon: Home },
    { href: "/orders", label: labels.orders, icon: ReceiptText },
    { href: "/cart", label: labels.cart, icon: ShoppingCart, badge: cartCount },
    { href: "/notifications", label: labels.notifications, icon: Bell, badge: unreadCount },
    { href: "/profile", label: labels.profile, icon: User },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-sand-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg justify-between px-2">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "relative flex min-h-touch flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium",
                  active ? "text-ocean-900" : "text-ink-300",
                )}
              >
                <span className="relative">
                  <Icon size={22} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />
                  {!!badge && badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-coral-500 px-1 text-[10px] font-bold text-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
