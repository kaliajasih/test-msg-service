const toggleFollow = async (targetId: string) => {
    if (!user) return;
    const isFollowing = following.has(targetId);
    if (isFollowing) {
      await supabase.from("follows").delete().match({ follower_id: user.id, following_id: targetId });
      setFollowing((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      // 👇 Bagian yang diperbaiki
      setFollowing((prev) => { const n = new Set(prev); n.add(targetId); return n; });
    }
  };