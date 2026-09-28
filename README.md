# HCWBB Summer Workout Competition

A mobile-first web app that runs the Haverford College Women's Basketball team's summer workout competition — the thing that used to live in a group chat and a shared spreadsheet.

Players log workouts from their phones, earn points for their assigned group, react to and comment on teammates' entries, and track monthly standings. Coaches and admins run the season: create groups, set point values, close out months, and invite players.

> Built and maintained solo — design, schema, auth, and deployment.

<!-- TODO: add 2–3 screenshots (home, standings, feed) — a README for a mobile UI is much stronger with images.
     Drop them in /public/screenshots and uncomment:
<p align="center">
  <img src="public/screenshots/home.png" width="240" />
  <img src="public/screenshots/standings.png" width="240" />
  <img src="public/screenshots/feed.png" width="240" />
</p>
-->

---

## Why I built it

Offseason accountability is a real problem for a team that scatters across the country every May. Tracking it by hand meant someone tallying a spreadsheet every week, no visibility between players, and no reason to keep going once you fell behind.

The app turns that into a live competition: log in under ten seconds, see your group's standing immediately, and get a reaction from a teammate for it.

## Features

**For players**
- **One-tap logging** — pick a workout type, date (today or up to 3 days back), optional note and photo. Repeating yesterday's workout is a single tap.
- **Social feed** — emoji reactions (👏 💪 🔥 ❤️) and comments on teammates' entries.
- **Standings** — group leaderboard, individual leaderboard, and a month-by-month history of past winners.
- **My Log** — personal entry history, running totals, and a current-streak counter.
- **48-hour edit window** — entries stay editable or deletable for two days, then lock.

**For admins**
- Create seasons and groups; assign players to a primary and an optional secondary group.
- Manage workout types and their point values; deactivate types without deleting history.
- Close out a month — snapshots group totals and records the winning group.
- Generate single-use invite links (7-day expiry) so roster signup stays closed.

## Tech stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React 19, Server Components) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Backend | Supabase — Postgres, Auth, Storage |
| Auth | Email/password + Google OAuth, session refresh in proxy middleware |
| Hosting | Vercel |
| Misc | `lucide-react` icons, a WebGL shader background on the login screen |

## Architecture notes

A few decisions worth calling out:

**Row Level Security as the primary authorization layer.** Every table has RLS enabled, with policies enforcing the real rules in the database rather than the UI — players can only insert entries as themselves, the 48-hour edit window is a `created_at > now() - interval '48 hours'` check in the update policy, and admin-only tables gate on a `role = 'admin'` subquery. See [`supabase/schema.sql`](supabase/schema.sql).

**Service-role API routes for privileged mutations.** RLS policies that depend on a user's *role* can't be satisfied by the browser client, so admin actions (group assignment, entry deletion) go through `/api/` routes that verify the caller server-side, then use a service-role client to perform the write. This keeps the service key off the client while still enforcing ownership and role checks in application code — see [`src/app/api/entries/[id]/route.ts`](src/app/api/entries/%5Bid%5D/route.ts).

**Server Components by default.** Pages fetch their data on the server with parallel Supabase queries and pass plain props to small client components that own the interactive bits (modals, tabs, reactions). Mutations that need a cache refresh use Server Actions with `revalidatePath`.

**Dual-group scoring.** Players can belong to two groups, so a single entry can count toward both. Standings resolve group membership per user at read time rather than trusting the `group_id` stored on the entry, which keeps historical entries correct after a player gets reassigned.

## Data model

```
seasons ──┬── groups ──┬── profiles (extends auth.users, has role + up to 2 groups)
          │            │
          └── entries ─┴── workout_types (name + point value)
                │
                ├── reactions
                └── comments

monthly_results   — frozen group totals + winner when an admin closes a month
invites           — single-use, expiring signup tokens
```

## Running locally

```bash
git clone https://github.com/urvimiyer/HCWBBSummerWorkoutCompetition.git
cd HCWBBSummerWorkoutCompetition
npm install
```

Create a Supabase project, run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor, and add a public storage bucket named `photos`.

Then copy the env template and fill it in:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then set your profile's `role` to `admin` in the Supabase table editor to reach `/admin` and create the first season and groups.

## Status

Built for the 2026 summer season and used by the team. Ongoing work: push notifications for streak reminders, and a season-long archive view.
