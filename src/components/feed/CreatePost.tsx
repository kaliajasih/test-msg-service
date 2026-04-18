"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import toast from "react-hot-toast";
import { HiPhoto, HiXMark } from "react-icons/hi2";
import TextareaAutosize from "react-textarea-autosize";

export default function CreatePost({ onCreated }: { onCreated: () => void }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const supabase = createClient();

  const handleSubmit = async () => {
    if (!content.trim() || !user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
      });
      if (error) throw error;
      setContent("");
      toast.success("Post shared! 🌿");
      onCreated();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="flex gap-3">
      <Image
        src={profile.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${profile.username}`}
        alt={profile.username}
        width={40} height={40}
        className="rounded-full flex-shrink-0 object-cover"
      />
      <div className="flex-1">
        <TextareaAutosize
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          minRows={2}
          maxRows={8}
          className="w-full bg-transparent outline-none resize-none text-sm leading-relaxed"
          style={{ color: "var(--text)" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg transition-all" style={{ color: "var(--text-muted)" }}
              title="Add image (coming soon)">
              <HiPhoto size={20} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: content.length > 260 ? "#ef4444" : "var(--text-subtle)" }}>
              {280 - content.length}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || loading || content.length > 280}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                boxShadow: content.trim() ? "0 4px 12px rgba(34,197,94,0.3)" : "none",
              }}>
              {loading ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
