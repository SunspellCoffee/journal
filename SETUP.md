# BrewLog Setup Guide

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a free project.

## 2. Run the database schema

In your Supabase project, go to **SQL Editor** and run the contents of `database/schema.sql`.

## 3. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these in your Supabase project under **Settings → API**.

## 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it will redirect you to login.

## 5. Deploy (optional)

The easiest deployment is Vercel:

```bash
npm install -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## App Icons (PWA)

To enable "Add to Home Screen" on mobile, add PNG icons to `/public/`:
- `icon-192.png` — 192×192px
- `icon-512.png` — 512×512px

---

## Features

- **Add coffees** — name, supplier, origin, process, flavor notes, weight, roast date
- **Resting windows** — configurable rest days and peak window per bag
- **Inventory** — filter by status (ready, resting, on order, finished)
- **Coffee detail** — edit, log brews, view brew history with ratings
- **Schedule** — auto-generated weekly calendar, drag-and-drop to reschedule
- **Dashboard** — today's queue, low stock alerts, recent brew log
- **Settings** — brews per day, brew size (grams), low stock threshold, notifications
- **PWA** — installable on mobile via "Add to Home Screen"
