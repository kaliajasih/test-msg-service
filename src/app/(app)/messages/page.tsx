"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { HiPaperAirplane, HiMagnifyingGlass, HiArrowLeft } from "react-icons/hi2";
import TextareaAutosize from "react-textarea-autosize";

interface ConversationWithProfile {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message: string | null;
  last_message_at: string | null;
  other_profile: any;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [selectedConv, setSelectedConv] = useState<ConversationWithProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, profile } = useAuth();
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (data) {
      const withProfiles = await Promise.all(
        data.map(async (conv) => {
          const otherId = conv.participant1_id === user.id ? conv.participant2_id : conv.participant1_id;
          const { data: prof } = await supabase.from("profiles").select("*").eq("id", otherId).single();
          return { ...conv, other_profile: prof };
        })
      );
      setConversations(withProfiles);
    }
    setLoading(false);
  }, [user]);

  const fetchMessages = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (data) { setMessages(data); setTimeout(scrollToBottom, 100); }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);

    const channel = supabase
      .channel(`messages-${selectedConv.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${selectedConv.id}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        setTimeout(scrollToBottom, 50);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv]);

  useEffect(() => {
    if (!searchUser.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .or(`username.ilike.%${searchUser}%,full_name.ilike.%${searchUser}%`)
        .neq("id", user?.id ?? "")
        .limit(5);
      if (data) setSearchResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchUser, user]);

  const startConversation = async (otherProfile: any) => {
    if (!user) return;
    setSearchUser(""); setSearchResults([]);

    const existing = conversations.find(
      (c) => c.other_profile?.id === otherProfile.id
    );
    if (existing) { setSelectedConv(existing); return; }

    const [p1, p2] = [user.id, otherProfile.id].sort();
    const { data, error } = await supabase
      .from("conversations")
      .upsert({ participant1_id: p1, participant2_id: p2 }, { onConflict: "participant1_id,participant2_id" })
      .select()
      .single();

    if (data) {
      const newConv = { ...data, other_profile: otherProfile };
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== data.id)]);
      setSelectedConv(newConv);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user || sending) return;
    setSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      conversation_id: selectedConv.id,
      sender_id: user.id,
      content,
    });
    setSending(false);
    await fetchConversations();
  };

  const avatarFor = (p: any) =>
    p?.avatar_url || `https://api.dicebear.com/8.x/avataaars/svg?seed=${p?.username}`;

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Conversation list */}
      <div className={`${selectedConv ? "hidden md:flex" : "flex"} flex-col w-full md:w-[320px] border-r flex-shrink-0`}
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
        
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h1 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Messages</h1>
          <div className="relative">
            <HiMagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }} />
            <input
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              placeholder="Search or start new chat..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none border"
              style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 rounded-xl border overflow-hidden"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
              {searchResults.map((p) => (
                <button key={p.id} onClick={() => startConversation(p)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-opacity-50 transition-all text-left border-b last:border-0"
                  style={{ borderColor: "var(--border)" }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--bg-input)")}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                  <Image src={avatarFor(p)} alt={p.username} width={32} height={32} className="rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      {p.full_name || p.username}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-subtle)" }}>@{p.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="w-10 h-10 rounded-full skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded skeleton w-24" />
                  <div className="h-3 rounded skeleton w-40" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
              <div className="text-4xl">💬</div>
              <p className="text-sm font-medium text-center" style={{ color: "var(--text-muted)" }}>
                No conversations yet. Search for someone to chat with!
              </p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button key={conv.id} onClick={() => setSelectedConv(conv)}
                className="flex items-center gap-3 w-full px-4 py-3 border-b transition-all text-left"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: selectedConv?.id === conv.id ? "var(--bg-input)" : "transparent",
                }}
                onMouseEnter={e => {
                  if (selectedConv?.id !== conv.id) e.currentTarget.style.backgroundColor = "color-mix(in srgb, var(--bg-input) 50%, transparent)";
                }}
                onMouseLeave={e => {
                  if (selectedConv?.id !== conv.id) e.currentTarget.style.backgroundColor = "transparent";
                }}>
                <Image src={avatarFor(conv.other_profile)} alt={conv.other_profile?.username || ""}
                  width={44} height={44} className="rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                      {conv.other_profile?.full_name || conv.other_profile?.username}
                    </p>
                    {conv.last_message_at && (
                      <span className="text-xs flex-shrink-0 ml-2" style={{ color: "var(--text-subtle)" }}>
                        {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {conv.last_message || "Start a conversation"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat window */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b glass flex-shrink-0"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "color-mix(in srgb, var(--bg-card) 85%, transparent)",
            }}>
            <button className="md:hidden mr-1" onClick={() => setSelectedConv(null)}
              style={{ color: "var(--text-muted)" }}>
              <HiArrowLeft size={20} />
            </button>
            <Image src={avatarFor(selectedConv.other_profile)} alt=""
              width={40} height={40} className="rounded-full object-cover" />
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                {selectedConv.other_profile?.full_name || selectedConv.other_profile?.username}
              </p>
              <p className="text-xs" style={{ color: "var(--text-subtle)" }}>
                @{selectedConv.other_profile?.username}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                <Image src={avatarFor(selectedConv.other_profile)} alt="" width={64} height={64}
                  className="rounded-full object-cover" />
                <p className="font-semibold" style={{ color: "var(--text)" }}>
                  {selectedConv.other_profile?.full_name || selectedConv.other_profile?.username}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Send your first message to start the conversation 👋
                </p>
              </div>
            )}
            {messages.map((msg, i) => {
              const isSelf = msg.sender_id === user?.id;
              const prevMsg = messages[i - 1];
              const showTime = !prevMsg || 
                new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() > 300000;
              return (
                <div key={msg.id} className="animate-message-in">
                  {showTime && (
                    <p className="text-center text-xs my-3" style={{ color: "var(--text-subtle)" }}>
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  )}
                  <div className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed
                      ${isSelf ? "bubble-sent" : "bubble-received"}`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message input */}
          <div className="px-4 py-3 border-t flex items-end gap-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
            <TextareaAutosize
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              placeholder="Type a message..."
              minRows={1}
              maxRows={5}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none resize-none border"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            <button onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
              <HiPaperAirplane size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-4"
          style={{ backgroundColor: "var(--bg)" }}>
          <div className="text-6xl">💬</div>
          <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>Your Messages</h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Select a conversation or search for someone to chat
          </p>
        </div>
      )}
    </div>
  );
}
