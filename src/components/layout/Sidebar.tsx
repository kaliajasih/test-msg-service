"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HiSparkles, HiHome, HiMagnifyingGlass, HiBell, HiEnvelope, HiUser, HiCog6Tooth } from "react-icons/hi2";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const navItems = [
  { icon: HiHome, label: "Home", href: "/home" },
  { icon: HiMagnifyingGlass, label: "Explore", href: "/explore" },
  { icon: HiBell, label: "Notifications", href: "/notifications" },
  { icon: HiEnvelope, label: "Messages", href: "/messages" },
  { icon: HiUser, label: "Profile", href: "/profile" },
  { icon: HiCog6Tooth, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] hidden lg:flex flex-col border-r z-20"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
      
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
        <Link href="/home" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #22c55e, #06b6d4)" }}>
            <HiSparkles size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text)" }}>
            Socially
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || (href !== "/home" && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all group"
              style={{
                backgroundColor: active ? "rgba(34, 197, 94, 0.1)" : "transparent",
                color: active ? "var(--brand)" : "var(--text-muted)",
                borderLeft: active ? "2px solid var(--brand)" : "2px solid transparent",
              }}>
              <Icon size={20} className="flex-shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
        {/* Theme toggle */}
        <button onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all"
          style={{ color: "var(--text-muted)" }}>
          {theme === "dark" ? <RiSunFill size={18} /> : <RiMoonFill size={18} />}
          <span className="text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {/* Profile + Sign out */}
        {profile && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ backgroundColor: "var(--bg-input)" }}>
            <Image
              src={profile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.username}`}
              alt={profile.username}
              width={36} height={36}
              className="rounded-full flex-shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
                {profile.full_name || profile.username}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-subtle)" }}>
                @{profile.username}
              </p>
            </div>
            <button onClick={signOut} className="text-xs font-medium px-2 py-1 rounded-lg transition-all"
              style={{ color: "var(--text-muted)" }}
              title="Sign out">
              ✕
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
