-- ============================================
-- SOCIALLY - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- POSTS TABLE
-- ============================================
create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count int default 0 not null,
  comments_count int default 0 not null,
  created_at timestamptz default now() not null
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone"
  on posts for select using (true);

create policy "Users can create their own posts"
  on posts for insert with check (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on posts for delete using (auth.uid() = user_id);

-- ============================================
-- POST LIKES TABLE
-- ============================================
create table public.post_likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(post_id, user_id)
);

alter table public.post_likes enable row level security;

create policy "Likes are viewable by everyone"
  on post_likes for select using (true);

create policy "Users can like posts"
  on post_likes for insert with check (auth.uid() = user_id);

create policy "Users can unlike posts"
  on post_likes for delete using (auth.uid() = user_id);

-- Update likes_count on like/unlike
create or replace function update_likes_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set likes_count = likes_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_like_change
  after insert or delete on post_likes
  for each row execute procedure update_likes_count();

-- ============================================
-- COMMENTS TABLE
-- ============================================
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on comments for select using (true);

create policy "Users can create comments"
  on comments for insert with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on comments for delete using (auth.uid() = user_id);

create or replace function update_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = comments_count - 1 where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on comments
  for each row execute procedure update_comments_count();

-- ============================================
-- FOLLOWS TABLE
-- ============================================
create table public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Follows are viewable by everyone"
  on follows for select using (true);

create policy "Users can follow others"
  on follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow others"
  on follows for delete using (auth.uid() = follower_id);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
create table public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant1_id uuid references public.profiles(id) on delete cascade not null,
  participant2_id uuid references public.profiles(id) on delete cascade not null,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now() not null,
  unique(participant1_id, participant2_id)
);

alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
  on conversations for select using (
    auth.uid() = participant1_id or auth.uid() = participant2_id
  );

create policy "Users can create conversations"
  on conversations for insert with check (
    auth.uid() = participant1_id or auth.uid() = participant2_id
  );

create policy "Users can update their conversations"
  on conversations for update using (
    auth.uid() = participant1_id or auth.uid() = participant2_id
  );

-- ============================================
-- MESSAGES TABLE
-- ============================================
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  read boolean default false not null,
  created_at timestamptz default now() not null
);

alter table public.messages enable row level security;

create policy "Users can view messages in their conversations"
  on messages for select using (
    exists (
      select 1 from conversations
      where id = messages.conversation_id
      and (participant1_id = auth.uid() or participant2_id = auth.uid())
    )
  );

create policy "Users can send messages"
  on messages for insert with check (auth.uid() = sender_id);

-- Update conversation last_message on new message
create or replace function update_conversation_last_message()
returns trigger as $$
begin
  update conversations
  set last_message = NEW.content, last_message_at = NEW.created_at
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_new_message
  after insert on messages
  for each row execute procedure update_conversation_last_message();

-- ============================================
-- REALTIME PUBLICATION
-- ============================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.posts;
alter publication supabase_realtime add table public.post_likes;
alter publication supabase_realtime add table public.conversations;
