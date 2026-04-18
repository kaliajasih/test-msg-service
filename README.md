# 🌿 Socially — Social Media & Chat App

A full-featured social media platform built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Deploy to Vercel in minutes.

## ✨ Features

- 🔐 **Auth** — Email/password signup & login with Supabase Auth
- 🏠 **Feed** — Real-time post feed with likes, comments, share
- 💬 **Messaging** — Real-time 1-on-1 chat with live updates
- 🔍 **Explore** — Search users and trending posts
- 👤 **Profiles** — Follow/unfollow, bio, post history
- 🔔 **Notifications** — Likes, comments, follows
- 🌙 **Dark / Light theme** — Persisted per user preference
- 📱 **Fully responsive** — Mobile-first with bottom nav

---

## 🚀 Quick Deploy

### 1. Clone & Install

```bash
git clone <your-repo>
cd socially
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open the **SQL Editor** and run the full contents of `supabase-schema.sql`
3. In **Authentication → Providers**, make sure **Email** is enabled
4. Copy your **Project URL** and **anon/public** API key from **Settings → API**

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy** ✅

### Supabase Auth Redirect URL

After deploying, add your Vercel URL to Supabase:
- Go to **Authentication → URL Configuration**
- Add `https://your-app.vercel.app` to **Site URL**
- Add `https://your-app.vercel.app/**` to **Redirect URLs**

---

## 📁 Project Structure

```
socially/
├── src/
│   ├── app/
│   │   ├── auth/page.tsx          # Login / Register
│   │   ├── (app)/
│   │   │   ├── layout.tsx         # App shell with sidebar
│   │   │   ├── home/page.tsx      # Feed
│   │   │   ├── explore/page.tsx   # Search & trending
│   │   │   ├── messages/page.tsx  # Real-time chat
│   │   │   ├── notifications/     # Notifications
│   │   │   ├── profile/page.tsx   # Own profile
│   │   │   ├── profile/[username] # Public profile
│   │   │   └── settings/page.tsx  # Settings
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx        # Desktop sidebar
│   │   │   ├── MobileNav.tsx      # Mobile bottom nav
│   │   │   └── RightSidebar.tsx   # Right panel
│   │   ├── feed/
│   │   │   ├── PostCard.tsx       # Single post
│   │   │   └── CreatePost.tsx     # Post composer
│   │   └── ThemeProvider.tsx      # Dark/light theme
│   ├── hooks/
│   │   └── useAuth.tsx            # Auth context
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser client
│   │   │   └── server.ts          # Server client
│   │   └── types.ts               # TypeScript types
│   └── styles/
│       └── globals.css            # Global styles
├── supabase-schema.sql            # ← Run this in Supabase
├── vercel.json
└── .env.example
```

---

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime |
| Styling | Tailwind CSS |
| Deployment | Vercel |
| Language | TypeScript |

---

## 🔧 Supabase Realtime

The following tables are enabled for real-time updates:
- `messages` — live chat
- `posts` — feed updates
- `post_likes` — like counts
- `conversations` — conversation list

This is set up automatically by `supabase-schema.sql`.

---

Made with 💚 by Socially
