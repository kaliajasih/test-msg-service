"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams } from "next/navigation";
import Image from "next/image";
import PostCard from "@/components/feed/PostCard";
import { HiCalendar, HiEnvelope } from "react-icons/hi2";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const isOwnProfile = profile?.id === user?.id;

  useEffect(() => {
    if (!username || !user) return;
    const load = async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("username", username).single();
      if (!prof) { setLoading(false); return; }
      setProfile(prof);

      const [postsRes, followCheckRes, followersRes, followingRes] = await Promise.all([
        supabase.from("posts").select("*, profiles(*)").eq("user_id", prof.id).order("created_at", { ascending: false }),
        supabase.from("follows").select("id").match({ follower_id: user.id, following_id: prof.id }).maybeSingle(),
        supabase.from("follows").select("id", { count: "exact" }).eq("following_id", prof.id),
        supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", prof.id),
      ]);

      const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
      const likedSet = new Set(likes?.map((l) => l.post_id));
      setPosts((postsRes.data || []).map((p: any) => ({ ...p, liked: likedSet.has(p.id) })));
      setIsFollowing(!!followCheckRes.data);
      setFollowerCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);
      setLoading(false);
    };
    load();
  }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    if (isFollowing) {
      await supabase.from("follows").delete().match({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(false);
      setFollowerCount((n) => n - 1);
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setFollowerCount((n) => n + 1);
    }
  };

  const startChat = async () => {
    if (!user || !profile) return;
    const [p1, p2] = [user.id, profile.id].sort();
    const { data } = await supabase
      .from("conversations")
      .upsert({ participant1_id: p1, participant2_id: p2 }, { onConflict: "participant1_id,participant2_id" })
      .select().single();
    if (data) router.push("/messages");
  };

  const handleLikeToggle = (postId: string, liked: boolean, count: number) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked, likes_count: count } : p));
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto">
      <div className="h-36 skeleton" />
      <div className="p-4"><div className="h-20 skeleton rounded-2xl" /></div>
    </div>
  );

  if (!profile) return (
    <div className="flex items-center justify-center h-64">
      <p style={{ color: "var(--text-muted)" }}>User not found</p>
    </div>
  );

  const avatarUrl = profile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.username}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="h-36 relative" style={{ background: "linear-gradient(135deg, #22c55e22, #06b6d422)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 30% 60%, #22c55e 0%, transparent 60%)" }} />
      </div>

      <div className="px-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-end justify-between -mt-12 mb-4">
          <Image src={avatarUrl} alt={profile.username} width={80} height={80}
            className="rounded-full border-4 object-cover"
            style={{ borderColor: "var(--bg)" }} />
          {!isOwnProfile && (
            <div className="flex items-center gap-2">
              <button onClick={startChat}
                className="p-2.5 rounded-xl border transition-all"
                style={{ borderColor: "var(--border-strong)", color: "var(--text)", backgroundColor: "var(--bg-card)" }}>
                <HiEnvelope size={18} />
              </button>
              <button onClick={toggleFollow}
                className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                style={isFollowing ? {
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text)",
                  border: "1px solid var(--border-strong)",
                } : {
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "white",
                }}>
                {isFollowing ? "Following" : "Follow"}
              </button>
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>{profile.full_name || profile.username}</h1>
        <p className="text-sm mb-2" style={{ color: "var(--text-subtle)" }}>@{profile.username}</p>
        {profile.bio && <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{profile.bio}</p>}
        <div className="flex items-center gap-1 mb-4" style={{ color: "var(--text-subtle)" }}>
          <HiCalendar size={14} />
          <span className="text-xs">Joined {format(new Date(profile.created_at), "MMMM yyyy")}</span>
        </div>
        <div className="flex items-center gap-6">
          <div>
            <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{followingCount}</span>
            <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>Following</span>
          </div>
          <div>
            <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{followerCount}</span>
            <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>Followers</span>
          </div>
        </div>
      </div>

      <div>
        {posts.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>No posts yet</div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />)
        )}
      </div>
    </div>
  );
}
