"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import PostCard from "@/components/feed/PostCard";
import { HiCalendar, HiPencil } from "react-icons/hi2";
import { format } from "date-fns";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const { user, profile: myProfile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [fullName, setFullName] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!user || !myProfile) return;
    setBio(myProfile.bio || "");
    setFullName(myProfile.full_name || "");
    loadData();
  }, [user, myProfile]);

  const loadData = async () => {
    if (!user) return;
    const [postsRes, followersRes, followingRes] = await Promise.all([
      supabase.from("posts").select("*, profiles(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("follows").select("id", { count: "exact" }).eq("following_id", user.id),
      supabase.from("follows").select("id", { count: "exact" }).eq("follower_id", user.id),
    ]);

    const { data: likes } = await supabase.from("post_likes").select("post_id").eq("user_id", user.id);
    const likedSet = new Set(likes?.map((l) => l.post_id));
    setPosts((postsRes.data || []).map((p: any) => ({ ...p, liked: likedSet.has(p.id) })));
    setFollowerCount(followersRes.count || 0);
    setFollowingCount(followingRes.count || 0);
    setLoading(false);
  };

  const handleLikeToggle = (postId: string, liked: boolean, count: number) => {
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, liked, likes_count: count } : p));
  };

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ bio, full_name: fullName, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) toast.error("Failed to save");
    else { toast.success("Profile updated!"); setEditing(false); }
  };

  if (!myProfile) return null;

  const avatarUrl = myProfile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${myProfile.username}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Cover */}
      <div className="h-36 relative" style={{ background: "linear-gradient(135deg, #22c55e22, #06b6d422, #8b5cf622)" }}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 60%), radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 60%)" }} />
      </div>

      {/* Profile info */}
      <div className="px-4 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-end justify-between -mt-12 mb-4">
          <div className="relative">
            <Image src={avatarUrl} alt={myProfile.username} width={80} height={80}
              className="rounded-full border-4 object-cover"
              style={{ borderColor: "var(--bg)" }} />
          </div>
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all"
            style={{ borderColor: "var(--border-strong)", color: "var(--text)", backgroundColor: "var(--bg-card)" }}>
            <HiPencil size={14} />
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Display name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: "var(--text-muted)" }}>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
                placeholder="Tell people about yourself..."
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border resize-none"
                style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }} />
            </div>
            <button onClick={saveProfile}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              Save changes
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              {myProfile.full_name || myProfile.username}
            </h1>
            <p className="text-sm mb-2" style={{ color: "var(--text-subtle)" }}>@{myProfile.username}</p>
            {myProfile.bio && (
              <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--text-muted)" }}>{myProfile.bio}</p>
            )}
            <div className="flex items-center gap-1 mb-4" style={{ color: "var(--text-subtle)" }}>
              <HiCalendar size={14} />
              <span className="text-xs">Joined {format(new Date(myProfile.created_at), "MMMM yyyy")}</span>
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
              <div>
                <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{posts.length}</span>
                <span className="text-sm ml-1" style={{ color: "var(--text-muted)" }}>Posts</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Posts */}
      <div>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="space-y-2">
                <div className="h-4 skeleton rounded w-48" />
                <div className="h-16 skeleton rounded-xl" />
              </div>
            </div>
          ))
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-4xl">📝</div>
            <p className="font-medium" style={{ color: "var(--text-muted)" }}>No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
          ))
        )}
      </div>
    </div>
  );
}
