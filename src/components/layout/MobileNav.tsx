"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiHome, HiMagnifyingGlass, HiBell, HiEnvelope, HiUser } from "react-icons/hi2";

const navItems = [
  { icon: HiHome, label: "Home", href: "/home" },
  { icon: HiMagnifyingGlass, label: "Explore", href: "/explore" },
  { icon: HiBell, label: "Notif", href: "/notifications" },
  { icon: HiEnvelope, label: "Messages", href: "/messages" },
  { icon: HiUser, label: "Profile", href: "/profile" },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-20 border-t"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all"
              style={{ color: active ? "var(--brand)" : "var(--text-muted)" }}>
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
