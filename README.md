# Prep — personal interview workspace

React + TypeScript + Vite + Tailwind + Supabase/PostgreSQL. All application records live in Supabase; browser storage is not used. With no database configured, the UI offers a **read-only sample preview**.

## Run locally

Requires Node.js 22+.

```sh
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL printed in the terminal (normally http://127.0.0.1:5173).

## Connect the database

1. Open your Supabase project's SQL editor and execute `supabase/001_initial.sql` once. It creates the eight tables, indexes, foreign keys, timestamp triggers, and transactional practice function.
2. In `.env`, set `SUPABASE_URL` and `SUPABASE_SECRET_KEY`. Use a server secret (`sb_secret_…`) or legacy `service_role` key from Project Settings → API Keys. **Do not paste that key in chat or put it in any VITE_ variable.**
3. Restart `npm run dev`. The header will say “Supabase connected.” The live database starts empty; preview examples are never silently inserted.

The supplied publishable key cannot access this database: RLS is enabled with no anonymous policies. A small local Express API performs validated operations using the server key. Both servers bind to loopback and reject cross-site API requests. This deliberately supports the requested no-login local app. **Do not expose the servers to the public internet or deploy this no-auth API.** Add authentication and per-user RLS before remote/multi-user use.

## Seed your Week 1 schedule

Prepare JSON like `supabase/week.example.json`, then run:

```sh
npm run seed -- ./supabase/week.example.json
```

Replace the example dates and tasks with your actual schedule. The seed command validates all rows before writing and upserts by stable UUID. Keep those IDs unchanged when rerunning to avoid duplicates. The UI also supports adding and rescheduling tasks directly.

## Review behavior

A new problem can be due immediately (Day 0). Recording an attempt or completing a due review writes immutable history and advances the schedule atomically by 1, 2, 4, 7, then 14 days. That yields Day 1, 3, 7, 14 after the initial session. RED/ORANGE attempts restart the sequence. The sequence is based on actual completion day, so overdue reviews don't stack up.

- **Too Easy:** GREEN, inactive, no next review; history retained.
- **Got Stuck:** RED, active, due today, reset review stage.
- **Review Later:** due tomorrow.
- **Mark Mastered:** GREEN, review again in 14 days.

Quick actions change planning/mastery without fabricating an attempt. Only “Record attempt” adds attempt history. Deleting a problem deletes its associated attempts and reviews and unlinks its tasks; confirmation explains this.

Dates and schedules use the computer's local timezone. Attempt timestamps are stored with timezone in PostgreSQL. Task duration sums each task's planned minutes; avoid overlapping tasks if using this as total study time. All-day and overnight time blocks are not supported in V1.

## Structure

- `src/pages`: requested workspace views
- `src/components`: shared editors and record browser
- `src/data`: client API and labeled sample data
- `src/domain`: types, field definitions, validation, scheduling
- `server`: loopback-only Supabase data-access API
- `supabase`: SQL migration and sample seed format

The route-based navigation can add a future Job Search module without changing existing records. No job tracking or authentication is included in V1.

## Check

```sh
npm run build
npm run lint
npm test
# With npm run dev running and Supabase configured:
node scripts/integration-check.mjs
```

Live integration is verified separately with temporary records. On databases created from the early initial schema, also run `supabase/002_attempt_retry_safety.sql` to make repeated attempt submissions idempotent. New installs already include this behavior.

## Git / GitHub

This directory is an independent Git repository. The `origin` remote is https://github.com/andyy-zhao/Interview-Prep.git. `.env` is ignored; verify `git status` before committing. The SQL schema, source, lockfile, and seed templates belong in Git.
