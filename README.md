# Workout Tracker

A personal, mobile-first web app to browse exercises, build routines, log workouts and watch your progress. Built for a sedentary beginner starting calisthenics at home (bodyweight, a wall and a chair), and approachable for anyone starting out.

> **Not medical advice.** The app records and organizes training. It does not prescribe exercise or assess whether an exercise is safe for you. Talk to a professional if you have health concerns.

## Status

Early development. Milestone 1 (foundation) is in place: responsive shell, theming, Supabase magic-link sign-in and a row-level-security-protected database. The feature modules below are planned.

| Module                 | Status  |
| ---------------------- | ------- |
| App shell, auth, theme | Done    |
| Exercise library       | Planned |
| Routines (A/B/C)       | Planned |
| Active workout         | Planned |
| Progress and streaks   | Planned |
| Offline PWA, export    | Planned |

## Planned features

- **Dashboard:** weekly goal ring, streak in weeks, next routine, quick start.
- **Exercise library:** search, filter by muscle and equipment, three-frame illustrations, instructions.
- **Routines:** editable starter A/B/C, sets, reps or seconds, rest times, ordering, duplication.
- **Active workout:** set-by-set logging, rest timer, pause and resume, notes.
- **Progress:** activity calendar, history, per-exercise charts, optional body weight log.
- **Quiet gamification:** weekly streaks and milestone badges, with no pushy notifications.

## Tech stack

React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Lucide, React Router, TanStack Query, Zod, Supabase (Auth + Postgres with RLS), Vitest and React Testing Library, oxlint, Prettier. Deployed on Vercel.

## Getting started

Requirements: Node.js 20+ and a [Supabase](https://supabase.com) project.

```bash
git clone <this-repo-url>
cd workout_guide
npm install
cp .env.example .env
```

Fill in `.env` from Supabase (Project Settings, API):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Use only the publishable (anon) key. Never put the secret or service-role key in this project.

In Supabase, under Authentication, URL Configuration, add `http://localhost:5173/**` (and your deployed URL) as redirect URLs, and make sure the Email provider is enabled. Apply the SQL in `supabase/migrations/` (see `supabase/README.md`), then:

```bash
npm run dev
```

## Scripts

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Start the dev server               |
| `npm run build`     | Typecheck and build for production |
| `npm run preview`   | Preview the production build       |
| `npm test`          | Run unit and component tests       |
| `npm run typecheck` | TypeScript check                   |
| `npm run lint`      | Lint with oxlint                   |
| `npm run format`    | Format with Prettier               |

## Project structure

```
src/
  app/          router and providers
  components/   ui (shadcn) and layout
  features/     dashboard, exercises, routines, workouts, progress, settings, auth
  hooks/        shared hooks
  lib/          env validation, Supabase client
  styles/       Tailwind and theme variables
supabase/
  migrations/   numbered SQL migrations
docs/superpowers/
  specs/        design document and approved mockups
  plans/        implementation plans
```

## Security notes

- The publishable key is public by design. Row Level Security is what protects data, and every table must have policies scoped to `auth.uid()`.
- `scripts/verify-rls.mjs` checks that anonymous clients cannot read or write.
- `.env` is gitignored. Do not commit secrets.

## Exercise data and licensing

The exercise catalog (planned) will combine open datasets, each with its own license:

- [Workout Guide](https://github.com/bryllim/workout-guide): code MIT, illustrations CC BY-SA 4.0.
- [free-exercise-db](https://github.com/yuhonas/free-exercise-db): text and metadata only, Unlicense. Its images have unknown licensing and will not be used.

Attribution will be shown in the app's Credits screen. Illustrations are CC BY-SA 4.0: derived or modified artwork must keep attribution and the same license.

## Contributing

This is a personal project, but issues and suggestions are welcome. Please keep changes small, write the failing test first, and run `npm test`, `npm run lint` and `npm run typecheck` before opening a pull request.

## License

Source code is released under the [MIT License](LICENSE). Exercise illustrations and data added later keep their own licenses (for example CC BY-SA 4.0 for Workout Guide artwork); see the Credits screen and the section above.
