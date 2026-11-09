# Workout Tracker

A personal, mobile-first web app to browse exercises, build routines, log workouts and watch your progress. Built for a sedentary beginner starting calisthenics at home (bodyweight, a wall and a chair), and approachable for anyone starting out.

> **Not medical advice.** The app records and organizes training. It does not prescribe exercise or assess whether an exercise is safe for you. Talk to a professional if you have health concerns.

## Status

Early development. Milestones 1 (foundation) and 2 (exercise catalog) are in place: responsive shell, theming, Supabase magic-link sign-in, row-level-security-protected settings, and a searchable library of 1,100+ exercises with illustrations and credits. The Library, exercise detail and Credits pages are public; everything personal needs sign-in.

| Module                 | Status  |
| ---------------------- | ------- |
| App shell, auth, theme | Done    |
| Exercise library       | Done    |
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

| Command                 | What it does                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| `npm run dev`           | Start the dev server                                                                                     |
| `npm run catalog:build` | Rebuild the exercise catalog and copy illustrations (runs automatically before dev, build and typecheck) |
| `npm run build`         | Typecheck and build for production                                                                       |
| `npm run preview`       | Preview the production build                                                                             |
| `npm test`              | Run unit and component tests                                                                             |
| `npm run typecheck`     | TypeScript check                                                                                         |
| `npm run lint`          | Lint with oxlint                                                                                         |
| `npm run format`        | Format with Prettier                                                                                     |

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

## Exercise catalog

The catalog is built by `npm run catalog:build` from two open datasets and is not stored in the database:

- [Workout Guide](https://github.com/bryllim/workout-guide) (npm `@bryllim/workout-guide`): 302 exercises with three illustrated frames each. Code MIT, illustrations CC BY-SA 4.0 (some derived from Everkinetic, also CC BY-SA 4.0). Frames are copied unchanged.
- [free-exercise-db](https://github.com/yuhonas/free-exercise-db): instructions, level and category, plus about 800 text-only exercises. Pinned snapshot in `data/sources/`. Unlicense per the maintainer; its images have unknown licensing and are **not used**.
- A few exercises written by this project (marked project-authored and unreviewed).

Every field keeps its source, license and author. Exercises with unknown equipment are never treated as available, and nothing is called beginner unless a source says so. The in-app Credits screen lists every source and illustration credit. Generated files (`src/data/exercise-catalog/`, `public/exercises/`) are gitignored.

## Contributing

This is a personal project, but issues and suggestions are welcome. Please keep changes small, write the failing test first, and run `npm test`, `npm run lint` and `npm run typecheck` before opening a pull request.

## License

Source code is released under the [MIT License](LICENSE). Exercise illustrations and data added later keep their own licenses (for example CC BY-SA 4.0 for Workout Guide artwork); see the Credits screen and the section above.
