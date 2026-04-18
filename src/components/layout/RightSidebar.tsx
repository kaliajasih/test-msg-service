"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Profile } from "@/lib/types";
import { HiMagnifyingGlass } from "react-icons/hi2";
import { useTheme } from "@/components/ThemeProvider";
import { RiMoonFill, RiSunFill } from "react-icons/ri";

export default function RightSidebar() {
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .neq("id", user.id)
        .limit(5);
      if (data) setSuggestions(data);

      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      if (follows) setFollowing(new Set(follows.map((f) => f.following_id)));
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
        .neq("id", user?.id ?? "")
        .limit(5);
      if (data) setSearchResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, user]);

  const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = following.has(targetId);
    if (isFollowing) {
      await supabase.from("follows").delete().match({ follower_id: user.id, following_id: targetId });
      setFollowing((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowing((prev) => new Set([...prev, targetId]));
    }
  };

  const displayList = search.trim() ? searchResults : suggestions;

  return (
    <aside className="hidden xl:flex flex-col w-[300px] px-6 py-4 flex-shrink-0 sticky top-0 h-dvh overflow-y-auto">
      {/* Search */}
      <div className="relative mb-6">
        <HiMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border)",
            color: "var(--text)",
          }}
        />
      </div>

      {/* People suggestions */}
      <div className="rounded-2xl border overflow-hidden mb-4"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>
            {search.trim() ? "Search results" : "Who to follow"}
          </h3>
        </div>
        <div>
          {displayList.length === 0 ? (
            <p className="px-4 py-4 text-sm" style={{ color: "var(--text-muted)" }}>
              {search.trim() ? "No users found" : "No suggestions"}
            </p>
          ) : (
            displayList.map((profile) => (
              <div key={profile.id} className="flex items-center gap-3 px-4 py-3 border-b last:border-0"
                style={{ borderColor: "var(--border)" }}>
                <Link href={`/profile/${profile.username}`}>
                  <Image
                    src={profile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.username}`}
                    alt={profile.username} width={36} height={36}
                    className="rounded-full object-cover flex-shrink-0" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${profile.username}`}
                    className="text-sm font-semibold truncate block hover:underline"
                    style={{ color: "var(--text)" }}>
                    {profile.full_name || profile.username}
                  </Link>
                  <p className="text-xs truncate" style={{ color: "var(--text-subtle)" }}>
                    @{profile.username}
                  </p>
                </div>
                <button
                  onClick={() => toggleFollow(profile.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex-shrink-0"
                  style={following.has(profile.id) ? {
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  } : {
                    backgroundColor: "var(--brand)",
                    color: "white",
                  }}>
                  {following.has(profile.id) ? "Following" : "Follow"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="flex items-center gap-2 px-4 py-3 rounded-xl border transition-all text-sm"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-muted)",
        }}>
        {theme === "dark" ? <RiSunFill size={16} /> : <RiMoonFill size={16} />}
        {theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
      </button>

      <p className="text-xs mt-6 px-1" style={{ color: "var(--text-subtle)" }}>
        © 2024 Socially · Made with 💚
      </p>
    </aside>
  );
}
