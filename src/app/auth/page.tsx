"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { HiSparkles, HiEye, HiEyeOff } from "react-icons/hi2";
import { useTheme } from "@/components/ThemeProvider";
import { RiMoonFill, RiSunFill } from "react-icons/ri";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back! 🎉");
        router.push("/home");
        router.refresh();
      } else {
        if (username.length < 3) throw new Error("Username must be at least 3 characters");
        if (!/^[a-z0-9_]+$/.test(username)) throw new Error("Username can only contain letters, numbers, and underscores");

        const { data: existing } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .single();
        if (existing) throw new Error("Username already taken");

        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { username, full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created! Welcome to Socially 🌿");
        router.push("/home");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex relative overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-[0.07] dark:opacity-[0.12]"
          style={{ background: "radial-gradient(circle, #22c55e 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-[0.05] dark:opacity-[0.08]"
          style={{ background: "radial-gradient(circle, #06b6d4 0%, transparent 70%)" }} />
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)" }} />
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="absolute top-6 right-6 z-10 p-2.5 rounded-xl border transition-all"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
        {theme === "dark" ? <RiSunFill size={18} /> : <RiMoonFill size={18} />}
      </button>

      {/* Left panel - hero */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-16 relative">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #22c55e, #06b6d4)" }}>
              <HiSparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--text)" }}>Socially</span>
          </div>
          <h1 className="text-6xl font-bold leading-tight mb-6" style={{ color: "var(--text)" }}>
            Connect.<br />
            <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: "linear-gradient(135deg, #22c55e, #06b6d4)" }}>
              Share.
            </span><br />
            Belong.
          </h1>
          <p className="text-lg leading-relaxed max-w-md" style={{ color: "var(--text-muted)" }}>
            A place where conversations bloom and connections matter. 
            Join a community built for authentic engagement.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-10">
          {[["10K+", "Users"], ["50K+", "Posts"], ["Real-time", "Chat"]].map(([val, label]) => (
            <div key={label}>
              <div className="text-2xl font-bold" style={{ color: "var(--brand)" }}>{val}</div>
              <div className="text-sm" style={{ color: "var(--text-subtle)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-[480px] flex items-center justify-center p-8 relative">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-10 justify-center">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #22c55e, #06b6d4)" }}>
              <HiSparkles size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: "var(--text)" }}>Socially</span>
          </div>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
            {mode === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "Sign in to your account to continue" : "Join Socially today — it's free"}
          </p>

          {/* Tab switcher */}
          <div className="flex rounded-xl p-1 mb-8" style={{ backgroundColor: "var(--bg-input)" }}>
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={{
                  backgroundColor: mode === m ? "var(--bg-card)" : "transparent",
                  color: mode === m ? "var(--text)" : "var(--text-muted)",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Full Name</label>
                  <input value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Username</label>
                  <input value={username} onChange={e => setUsername(e.target.value.toLowerCase())}
                    placeholder="e.g. john_doe"
                    required
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border"
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: "var(--border)",
                      color: "var(--text)",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--brand)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all border"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }}
                onFocus={e => e.target.style.borderColor = "var(--brand)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required minLength={6}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all border"
                  style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }}
                  onFocus={e => e.target.style.borderColor = "var(--brand)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--text-muted)" }}>
                  {showPass ? <HiEyeOff size={18} /> : <HiEye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all mt-2 disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                boxShadow: loading ? "none" : "0 4px 15px rgba(34, 197, 94, 0.35)",
              }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--text-muted)" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-semibold" style={{ color: "var(--brand)" }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
