"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Post, Profile } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { HiHeart, HiOutlineHeart, HiChatBubbleOvalLeft, HiShare } from "react-icons/hi2";
import toast from "react-hot-toast";

type PostWithProfile = Post & { profiles: Profile; liked: boolean };

interface Props {
  post: PostWithProfile;
  onLikeToggle: (postId: string, liked: boolean, count: number) => void;
}

export default function PostCard({ post, onLikeToggle }: Props) {
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  const handleLike = async () => {
    if (!user || liking) return;
    setLiking(true);
    try {
      if (post.liked) {
        await supabase.from("post_likes").delete().match({ post_id: post.id, user_id: user.id });
        onLikeToggle(post.id, false, post.likes_count - 1);
      } else {
        await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
        onLikeToggle(post.id, true, post.likes_count + 1);
      }
    } catch {}
    setLiking(false);
  };

  const loadComments = async () => {
    if (commentsLoaded) return;
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(*)")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
    setCommentsLoaded(true);
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments) await loadComments();
  };

  const submitComment = async () => {
    if (!comment.trim() || !user || submittingComment) return;
    setSubmittingComment(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: user.id, content: comment.trim() })
      .select("*, profiles(*)")
      .single();
    if (!error && data) {
      setComments((prev) => [...prev, data]);
      setComment("");
    }
    setSubmittingComment(false);
  };

  const avatarUrl = post.profiles?.avatar_url ||
    `https://api.dicebear.com/8.x/avataaars/svg?seed=${post.profiles?.username}`;

  return (
    <article className="px-4 py-4 border-b transition-all animate-post-in hover:bg-opacity-50"
      style={{ borderColor: "var(--border)" }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--bg-input) 40%, transparent)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      <div className="flex gap-3">
        <Link href={`/profile/${post.profiles?.username}`}>
          <Image src={avatarUrl} alt={post.profiles?.username || "user"}
            width={40} height={40}
            className="rounded-full flex-shrink-0 object-cover hover:opacity-90 transition-opacity" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.profiles?.username}`}
              className="font-semibold text-sm hover:underline" style={{ color: "var(--text)" }}>
              {post.profiles?.full_name || post.profiles?.username}
            </Link>
            <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
              @{post.profiles?.username}
            </span>
            <span className="text-xs" style={{ color: "var(--text-subtle)" }}>·</span>
            <span className="text-xs" style={{ color: "var(--text-subtle)" }}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>

          <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
            {post.content}
          </p>

          {post.image_url && (
            <img src={post.image_url} alt="Post image"
              className="mt-3 rounded-xl w-full object-cover max-h-80 border"
              style={{ borderColor: "var(--border)" }} />
          )}

          {/* Actions */}
          <div className="flex items-center gap-6 mt-3">
            <button onClick={handleLike}
              className="flex items-center gap-1.5 group transition-all"
              style={{ color: post.liked ? "#ef4444" : "var(--text-muted)" }}>
              {post.liked
                ? <HiHeart size={18} className="group-hover:scale-110 transition-transform" />
                : <HiOutlineHeart size={18} className="group-hover:scale-110 transition-transform" />}
              <span className="text-xs font-medium">{post.likes_count || 0}</span>
            </button>

            <button onClick={toggleComments}
              className="flex items-center gap-1.5 transition-all"
              style={{ color: showComments ? "var(--brand)" : "var(--text-muted)" }}>
              <HiChatBubbleOvalLeft size={18} />
              <span className="text-xs font-medium">{post.comments_count || 0}</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.origin + "/post/" + post.id);
                toast.success("Link copied!");
              }}
              className="flex items-center gap-1.5 transition-all"
              style={{ color: "var(--text-muted)" }}>
              <HiShare size={18} />
            </button>
          </div>

          {/* Comments */}
          {showComments && (
            <div className="mt-4 space-y-3 animate-fade-in">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Image
                    src={c.profiles?.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${c.profiles?.username}`}
                    alt={c.profiles?.username} width={28} height={28}
                    className="rounded-full flex-shrink-0 object-cover" />
                  <div className="flex-1 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bg-input)" }}>
                    <span className="text-xs font-semibold mr-2" style={{ color: "var(--text)" }}>
                      {c.profiles?.full_name || c.profiles?.username}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{c.content}</span>
                  </div>
                </div>
              ))}

              <div className="flex gap-2 mt-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 rounded-xl text-xs outline-none border"
                  style={{
                    backgroundColor: "var(--bg-input)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                />
                <button onClick={submitComment} disabled={!comment.trim() || submittingComment}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
