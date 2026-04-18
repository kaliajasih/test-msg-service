"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { HiBell } from "react-icons/hi2";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get likes on my posts
      const { data: likesData } = await supabase
        .from("post_likes")
        .select("*, profiles(*), posts(content)")
        .eq("posts.user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get new followers
      const { data: followsData } = await supabase
        .from("follows")
        .select("*, profiles!follower_id(*)")
        .eq("following_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      // Get comments on my posts
      const { data: commentsData } = await supabase
        .from("comments")
        .select("*, profiles(*), posts!inner(user_id, content)")
        .eq("posts.user_id", user.id)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      const merged = [
        ...(likesData || []).map((l) => ({ ...l, type: "like" })),
        ...(followsData || []).map((f) => ({ ...f, type: "follow" })),
        ...(commentsData || []).map((c) => ({ ...c, type: "comment" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(merged);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 px-4 py-4 border-b glass"
        style={{ backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)", borderColor: "var(--border)" }}>
        <h1 className="text-xl font-bold" style={{ color: "var(--text)" }}>Notifications</h1>
      </div>

      {loading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="w-10 h-10 rounded-full skeleton" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 skeleton rounded w-48" />
              <div className="h-3 skeleton rounded w-32" />
            </div>
          </div>
        ))
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <HiBell size={48} style={{ color: "var(--text-subtle)" }} />
          <p className="font-medium" style={{ color: "var(--text-muted)" }}>No notifications yet</p>
          <p className="text-sm" style={{ color: "var(--text-subtle)" }}>When people interact with you, it'll show here</p>
        </div>
      ) : (
        notifications.map((notif, i) => {
          const profile = notif.profiles;
          const avatarUrl = profile?.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile?.username}`;
          let emoji = "❤️", text = "";

          if (notif.type === "like") {
            emoji = "❤️";
            text = `liked your post`;
          } else if (notif.type === "follow") {
            emoji = "👥";
            text = `started following you`;
          } else if (notif.type === "comment") {
            emoji = "💬";
            text = `commented: "${notif.content}"`;
          }

          return (
            <div key={i}
              className="flex items-start gap-3 px-4 py-4 border-b transition-all"
              style={{ borderColor: "var(--border)" }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--bg-input) 40%, transparent)")}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
              <div className="relative">
                <Image src={avatarUrl} alt={profile?.username || ""} width={40} height={40}
                  className="rounded-full object-cover" />
                <span className="absolute -bottom-1 -right-1 text-sm">{emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "var(--text)" }}>
                  <Link href={`/profile/${profile?.username}`}
                    className="font-semibold hover:underline">{profile?.username}</Link>
                  {" "}{text}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-subtle)" }}>
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
