"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

// Customer bottom navigation. Home and Search are wired routes; Bookings,
// Messages, and Profile are scaffolded placeholders (not yet built).
const items = [
  { label: "Home", icon: "home", href: "/customer" },
  { label: "Search", icon: "search", href: "/search" },
  { label: "Bookings", icon: "event_note", href: null },
  { label: "Messages", icon: "chat", href: null },
  { label: "Profile", icon: "person", href: null },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-gutter pb-safe bg-surface-container-lowest border-t border-outline-variant/20 shadow-sm h-[80px] md:hidden">
      {items.map((item) => {
        const active = item.href !== null && pathname === item.href;
        const inner = (
          <span
            className={`flex flex-col items-center justify-center rounded-full px-4 py-1 transition-transform active:scale-90 ${
              active
                ? "bg-secondary-container text-on-secondary-container"
                : "text-on-surface-variant"
            }`}
          >
            <Icon name={item.icon} fill={active} className="text-2xl" />
            <span className="font-label-lg text-[10px] mt-1">{item.label}</span>
          </span>
        );

        return item.href ? (
          <Link key={item.label} href={item.href} aria-label={item.label}>
            {inner}
          </Link>
        ) : (
          <button key={item.label} type="button" aria-label={item.label}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
