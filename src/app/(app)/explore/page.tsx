"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/feed/PostCard";
import Image from "next/image";
import Link from "next/link";
import { HiMagnifyingGlass, HiFire } from "react-icons/hi2";

export default function ExplorePage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [people, setPeople] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"trending" | "people">("trending");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [postsRes, peopleRes] = await Promise.all([
      supabase.from("posts").select("*, profiles(*)").order("likes_count", { ascending: false }).limit(20),
      supabase.from("profiles").select("*").neq("id", user.id).limit(12),
    ]);

    const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
    const likedSet = new Set(likes?.map((l) => l.post_id));
    setPosts((postsRes.data || []).map((p: any) => ({ ...p, liked: likedSet.has(p.id) })));
    setPeople(peopleRes.data || []);
    setLoading(false);
  };

  const handleLikeToggle = (postId: string, liked: boolean, count: number) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked, likes_count: count } : p));
  };

  const filteredPosts = search
    ? posts.filter((p) => p.content.toLowerCase().includes(search.toLowerCase()))
    : posts;

  const filteredPeople = search
    ? people.filter((p) => p.username.includes(search.toLowerCase()) || (p.full_name || "").toLowerCase().includes(search.toLowerCase()))
    : people;

  return (
    <div className="flex min-h-dvh">
      <div className="flex-1 max-w-2xl mx-auto xl:mr-0 w-full">
        <div className="sticky top-0 z-10 px-4 py-4 border-b glass"
          style={{ backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)", borderColor: "var(--border)" }}>
          <div className="relative mb-4">
            <HiMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts, people..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: "var(--bg-input)" }}>
            {(["trending", "people"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                style={{
                  backgroundColor: tab === t ? "var(--bg-card)" : "transparent",
                  color: tab === t ? "var(--text)" : "var(--text-muted)",
                }}>
                {t === "trending" ? "🔥 Trending" : "👥 People"}
              </button>
            ))}
          </div>
        </div>

        {tab === "trending" ? (
          <div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                  <div className="h-20 skeleton rounded-xl" />
                </div>
              ))
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>No posts found</div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
              ))
            )}
          </div>
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPeople.map((person) => (
              <Link key={person.id} href={`/profile/${person.username}`}
                className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--brand)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border)")}>
                <Image
                  src={person.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${person.username}`}
                  alt={person.username} width={48} height={48} className="rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                    {person.full_name || person.username}
                  </p>
                  <p className="text-xs truncate" style={{ color: "var(--text-subtle)" }}>@{person.username}</p>
                  {person.bio && (
                    <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{person.bio}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
