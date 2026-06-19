# 🛡️ Nestlé SHE Day 2025 — Interactive Challenge Platform

> Safety · Health · Environment — gamified quiz & challenge app for Nestlé Sales Region staff.

## Tech Stack

| Layer     | Tech                         |
|-----------|------------------------------|
| Framework | Next.js 14 (App Router)      |
| Styling   | Tailwind CSS                 |
| Database  | Supabase (PostgreSQL)        |
| Auth      | Supabase Auth (optional)     |
| Hosting   | Vercel                       |
| Language  | TypeScript                   |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/nestle-she-day.git
cd nestle-she-day
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Open **SQL Editor** → **New Query**
3. Paste the contents of `supabase/schema.sql` and click **Run**
4. Go to **Project Settings → API** and copy your URL + anon key

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy** ✓

---

## 📁 Project Structure

```
nestle-she-day/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Home page (leaderboard + module grid)
│   ├── globals.css             # Nestlé theme tokens + animations
│   └── modules/
│       └── [id]/
│           └── page.tsx        # Module detail + game list
├── components/
│   ├── NavHeader.tsx           # Sticky top nav with Nestlé logo
│   ├── ScoreTicker.tsx         # Scrolling live score ticker
│   ├── HeroBanner.tsx          # Hero section with progress bar
│   ├── Scoreboard.tsx          # Top-5 team leaderboard card
│   ├── ModuleCard.tsx          # Individual module card
│   └── NestleLogo.tsx          # Nestlé SVG logo component
├── lib/
│   ├── modules.ts              # All 10 module + game definitions
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       └── server.ts           # Server Supabase client
├── types/
│   └── database.ts             # Supabase TypeScript types
├── supabase/
│   └── schema.sql              # DB schema + seed data
├── .env.local.example          # Environment variable template
└── tailwind.config.ts          # Tailwind + Nestlé brand tokens
```

---

## 🎮 Game Modules

| # | Module | Priority | Games |
|---|--------|----------|-------|
| 1 | Safe Driving | P1 | Rapid-Fire Quiz, Car Checklist, Hazard Spotter |
| 2 | Slips, Trips & Falls | P1 | Snap & Upload, Hazard Spotter, Ladder Sequencer |
| 3 | Fire Emergency | P2 | PASS Sorter, Server Room Scenario |
| 4 | Plastic Recycling | P2 | Resin Codes, Scavenger Hunt, Waste Sorter |
| 5 | Balanced Diet | P2 | Plate Assembler, Calorie Calc, RM12 Challenge, Tracker |
| 6 | Heart Health | P2 | Assessment Quiz, Accuracy Slider, MHR Calc |
| 7 | Stress & Mental Health | P2 | 10Q Assessment, Stress Quiz, Reflection Console |
| 8 | Ergonomics & Lifting | P3 | Lifting Video, Posture Checklist, Tick Setup |
| 9 | Exercise & Stretching | P3 | Squat Portal, Push-Up Canvas, Fitness Sorter |
| 10 | CPR & Medical Emergency | P3 | DRBAC Sequencer, Rescue Snapshot, Recovery Position |

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `teams` | Team registry (name, colour, initials) |
| `scores` | Per-team per-game scores + time |
| `module_progress` | Module completion status per team |
| `quiz_responses` | Raw response data for analytics |
| `photo_submissions` | Supabase Storage paths for camera games |
| `team_leaderboard` | View: aggregated rankings |

---

## 🧱 Build Order (Step by Step)

- [x] Step 1: Project setup, theme, home page ← **You are here**
- [ ] Step 2: Module 1 Game 1 — Rapid-Fire Quiz
- [ ] Step 3: Module 1 Game 2 — Car Checklist Validator
- [ ] Step 4: Module 1 Game 3 — Hazard Spotter
- [ ] Step 5: Module 2 Game 1 — Snap & Upload (Camera)
- [ ] Step 6: Module 2 Game 2 — Hazard Image Spotter
- [ ] Step 7: Module 2 Game 3 — Ladder Safety Sequencer
- [ ] ... continuing through all 10 modules

---

## License

Internal use only — Nestlé Malaysia SHE Day 2025.
