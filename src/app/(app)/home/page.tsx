"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/feed/PostCard";
import CreatePost from "@/components/feed/CreatePost";
import RightSidebar from "@/components/layout/RightSidebar";
import { Post, Profile } from "@/lib/types";

type PostWithProfile = Post & { profiles: Profile; liked: boolean };

export default function HomePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles(*)`)
      .order("created_at", { ascending: false })
      .limit(30);

    if (data) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      const likedSet = new Set(likes?.map((l) => l.post_id));
      setPosts(data.map((p: any) => ({ ...p, liked: likedSet.has(p.id) })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("posts-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const handlePostCreated = () => fetchPosts();
  const handleLikeToggle = (postId: string, liked: boolean, count: number) => {
    setPosts((prev) =>
      prev.map((p) => p.id === postId ? { ...p, liked, likes_count: count } : p)
    );
  };

  return (
    <div className="flex min-h-dvh">
      {/* Feed */}
      <div className="flex-1 max-w-2xl mx-auto xl:mr-0 w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-4 border-b glass"
          style={{
            backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
            borderColor: "var(--border)",
          }}>
          <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Home</h1>
        </div>

        {/* Create post */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <CreatePost onCreated={handlePostCreated} />
        </div>

        {/* Posts */}
        <div>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded-lg skeleton w-32" />
                    <div className="h-3 rounded-lg skeleton w-20" />
                    <div className="h-16 rounded-xl skeleton mt-3" />
                  </div>
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="text-5xl">🌱</div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>No posts yet</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Be the first to share something!</p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
            ))
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <RightSidebar />
    </div>
  );
}
