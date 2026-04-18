"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { HiArrowRightOnRectangle, HiTrash, HiSun, HiMoon } from "react-icons/hi2";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Password updated!"); setNewPassword(""); setConfirmPassword(""); }
    setSavingPassword(false);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 px-4 py-4 border-b glass"
        style={{ backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Settings</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Account */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Account</h2>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Email</label>
              <input disabled value={user?.email || ""} className="w-full px-3 py-2.5 rounded-xl text-sm border opacity-60"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "var(--text-muted)" }}>Username</label>
              <input disabled value={`@${profile?.username || ""}`} className="w-full px-3 py-2.5 rounded-xl text-sm border opacity-60"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Change Password</h2>
          </div>
          <div className="p-5 space-y-3">
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password" className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }} />
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password" className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }} />
            <button onClick={handleChangePassword} disabled={!newPassword || savingPassword}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              {savingPassword ? "Saving..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>Appearance</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Theme</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Currently using {theme} mode</p>
              </div>
              <button onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
                style={{ borderColor: "var(--border-strong)", color: "var(--text)", backgroundColor: "var(--bg-input)" }}>
                {theme === "dark" ? <HiSun size={16} /> : <HiMoon size={16} />}
                Switch to {theme === "dark" ? "light" : "dark"}
              </button>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#ef444440", backgroundColor: "var(--bg-card)" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#ef444430" }}>
            <h2 className="font-semibold text-red-500">Danger Zone</h2>
          </div>
          <div className="p-5">
            <button onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all text-red-500 border border-red-500/30 hover:bg-red-500/10">
              <HiArrowRightOnRectangle size={16} />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
