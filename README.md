# Nestlé Sales Region SHE Day 2026 — Team Challenge App

Next.js 14 (App Router) + Supabase, built from the SHE Day briefing deck and
wireframe annotations. This README is the map — read it before you touch the
database.

## 1. File structure

```
app/
  page.tsx                       Landing — team create/join + scoreboard
  play/page.tsx                  Module hub (10 tiles, live progress)
  play/[moduleId]/page.tsx       Routes to QuestionRunner or QRPrivacyFlow
  mental-health-assessment/      Standalone anonymous route (Module 4)
  admin/login/                   Facilitator sign-in (Supabase Auth)
  admin/dashboard/               Leaderboard, grading queue, speed bonus
  api/speed-bonus/route.ts       Service-role endpoint for the +50 bonus
components/
  team/                          CreateTeamForm, Leaderboard
  game/                          QuestionRunner + the silence-rule machinery
  game/inputs/                   13 input components, one per interaction type
  admin/                         Grading UI
lib/
  supabase/                      client.ts (browser) / server.ts (RSC) / admin.ts (service role)
  hooks/                         useTeam, useRealtimeLeaderboard, useGameTimer, …
  game/questions.ts              THE QUESTION BANK — 32 questions, all 10 modules
  game/scoring.ts                Admin-side grading helpers (display only, see below)
  game/shuffle.ts                Per-team stable shuffle ("JUMBLE UP")
types/
  database.ts                    Hand-aligned Supabase types
  game.ts                        Question/Module domain types, discriminated union
supabase/migrations/
  0001_init.sql                  Tables, RLS, score trigger, create_team() RPC
  0002_answer_keys_and_autograde.sql   Server-side answer keys + apply_autograde()
  0003_storage_policies.sql      Storage bucket for photo/video uploads
```

## 2. Setup

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project's URL + keys
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push               # runs all three migrations in order
npm run dev
```

Create at least one admin user for the dashboard: Supabase Dashboard →
Authentication → Add user (email/password). That's who signs in at
`/admin/login`.

## 3. Engineering decisions worth knowing about

**English + Bahasa Malaysia, switchable anytime.** Every player-facing
screen reads from `lib/i18n/LanguageContext.tsx` — a `LanguageToggle` (the
"EN / BM" pill, top-right) flips the whole app instantly, no reload, and the
choice persists in `localStorage`. The question bank itself is bilingual at
the type level: `types/game.ts`'s `Text = { en, bm }` makes it a *compile
error* to add a question and forget one language. Question wording was
also simplified to short, plain sentences (these are read on a phone under
a countdown timer, not a textbook).
  - `lib/i18n/ui.ts` holds every static UI string (buttons, labels, empty
    states) in both languages.
  - `lib/game/questions.ts` holds the bilingual question content.
  - A few fields are deliberately **not** translated: `q30`'s P.A.S.S
    acronym (taught in English even in Malay safety materials, since the
    letters spell the acronym), and the admin dashboard (facilitators only,
    kept English to limit scope — flip `GradingCard`/`SpeedBonusToggle` to
    use `tx()`/`t()` instead of `.en` if you want it bilingual too).
  - Two question types (`visual_sort`, `subjective_select`) needed a
    refactor to **id-based choices** rather than raw strings — a selection
    has to grade the same regardless of which language it was shown in, so
    `correctChoiceIds` lives in the DB answer key instead of display text.
  - The Module 4 QR code carries the team's current language in its URL
    (`?lang=bm`), so the private mental-health check-in opens already in
    the right language on whatever second device scans it.

**Team numbering is a Postgres sequence behind an RPC (`create_team`), not a
client-side `MAX()+1`.** Two teams tapping "Create Team" in the same second
at a live event will otherwise both get "Team 5". `nextval()` is atomic; a
naive select-then-insert isn't.

**Scores are never written directly — they're derived.** A trigger
(`recalc_team_score`) recomputes `teams.current_total_score` from
`game_responses.points_awarded` + `session_speed_bonus` any time either
changes. The leaderboard can't drift from the underlying grading data.

**Grading is authoritative in Postgres, not the browser.** The question bank
(`lib/game/questions.ts`) lives in the frontend for rendering, but a mirror
of just the *answer keys* lives in `question_answer_keys`
(migration `0002`). `apply_autograde()` re-reads whatever was already
inserted and grades it server-side — the client never gets to assert "I got
this right." `lib/game/scoring.ts` runs the same comparisons in TypeScript,
but only to show admins a preview; it does not write points.

**"Absolute silence" is enforced in one place.** `QuestionRunner` never
reads back `is_correct` while a module is in progress, and none of the 13
input components have any concept of correctness — they just collect an
answer shape. The only screen allowed to mention points is
`ModuleCompleteScreen`, reached only after the whole module is submitted.

**Drag-and-drop is implemented as tap-to-place, not native HTML5 drag.**
Most teams will be on phones. `dragstart`/`dragover` don't fire reliably on
touchscreens; "tap a card, then tap its destination" does, on every device,
with zero extra dependencies. If you want pointer-drag polish for desktop
later, swap the interaction inside `DragSequenceInput` /
`DragMatrixInput` / `CategorizedDropzoneInput` for `@dnd-kit/core` — the
data shapes (`order`, `matches`, `placements`) don't need to change.

**Module 4 (Mental Health) bypasses `game_responses` entirely.** No
`team_id` ever touches that flow. See the schema comment at the top of
`0001_init.sql`.

## 4. Assets you still need to supply

Search the codebase for `// TODO` — there are two categories:

1. **5 dashcam-style clips** for Q6/8/10/12/14 (`lib/game/questions.ts`,
   `videoUrl` fields) — currently pointing at `/media/safe-driving/*.mp4`
   placeholders. Drop real files in `public/media/safe-driving/` or swap the
   paths for Supabase Storage URLs.
2. **The Q17 hazard-spotting photo** — `imageUrl` in the `q17` entry is a
   placeholder, and the 10 hazard coordinates + 5 decoy coordinates are
   illustrative percentages, not measured against a real photo. Once you
   have the actual office/outlet photo, re-plot `hazards`/`decoyZones`
   against it (open the image, tap-test in the browser, read the
   percentages back from `HazardCanvasInput`'s tap handler if it's easier
   than eyeballing).

## 5. Known tradeoffs / hardening notes for a recurring event

- **Visual style.** This build matches the reference hub's *structure* —
  free pick-any-module navigation (no forced order), per-module completion
  badges, and the same "EN / BM" toggle pattern — but keeps the existing
  Nestlé navy/red palette rather than a full dark/terminal reskin. If you
  want the deeper visual treatment (dark theme, glow accents, a mascot,
  arcade-style timer), that's a separate pass — happy to do it, just flag
  which specific elements matter most.
- **Players aren't authenticated.** "Create/Join Team" just remembers a
  `team_id` in `localStorage`. Fine for a single-day kiosk event; if you run
  this repeatedly, consider Supabase anonymous auth per team and tightening
  the `game_responses` RLS policy to check `auth.uid()` instead of trusting
  the client-held `team_id` (flagged inline in `0001_init.sql`).
- **`question_answer_keys` is hand-maintained** alongside
  `lib/game/questions.ts`. They're cross-checked once here, but if you edit
  one without the other, auto-grading will silently disagree with the
  question bank. Promote this to a generation script if the content changes
  often (read `QUESTIONS`, emit the SQL) — noted inline in migration `0002`.
- **Storage upload paths aren't validated against a real `team_id`** at the
  RLS level (`0003_storage_policies.sql`) — a stray upload costs storage
  space, not data integrity, since nothing surfaces in the admin queue
  without a matching `game_responses` row. Acceptable for an internal event;
  tighten if this becomes public-facing.

## 6. Deployment (Vercel via GitHub Codespaces)

```bash
git push origin main
vercel link
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY   # mark server-only, do not expose
vercel --prod
```

Enable Realtime on `teams`, `game_responses`, `session_speed_bonus`, and
`team_module_progress` in the Supabase dashboard if `alter publication
supabase_realtime add table …` in `0001_init.sql` didn't already take
(it's idempotent, safe to re-run).
