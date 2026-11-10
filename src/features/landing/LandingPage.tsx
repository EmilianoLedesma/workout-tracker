import { Link } from 'react-router'
import { CalendarCheck, ClipboardCheck, ListChecks } from 'lucide-react'

const STEPS = [
  {
    title: 'Pick a routine',
    text: 'Start from a short beginner plan or build your own from the library.',
    Icon: ListChecks,
  },
  {
    title: 'Log each session',
    text: 'Tick off sets and reps as you go. It takes seconds.',
    Icon: ClipboardCheck,
  },
  {
    title: 'Watch your weeks stack up',
    text: 'Each week you hit your goal fills in on the tally.',
    Icon: CalendarCheck,
  },
] as const

// Decorative tally: two done days, one dashed "next session" slot.
const WEEK = [
  { day: 'M', state: 'on' },
  { day: 'T', state: 'off' },
  { day: 'W', state: 'on' },
  { day: 'T', state: 'off' },
  { day: 'F', state: 'next' },
  { day: 'S', state: 'off' },
  { day: 'S', state: 'off' },
] as const

const cell = {
  on: 'bg-accent-fill text-ink',
  off: 'bg-cell text-muted-foreground',
  next: 'border-2 border-dashed border-accent-fill text-accent-text',
} as const

const focusRing =
  'outline-offset-4 focus-visible:outline-2 focus-visible:outline-accent-text'

export default function LandingPage() {
  return (
    <div className="bg-grid min-h-dvh bg-background text-foreground">
      <main className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-6 md:px-10 md:py-10">
        <p className="font-display text-xl font-black tracking-wider text-accent-text uppercase">
          Workout Tracker
        </p>

        {/* Type is the layout: three stacked lines, "Three" oversized as the anchor. */}
        <h1 className="font-display mt-10 text-[clamp(4.25rem,19vw,10.5rem)] leading-[0.84] font-black tracking-tight uppercase">
          Show up.{' '}
          <span className="block text-[1.3em] text-accent-text">Three</span> a
          week.
        </h1>

        <p className="mt-6 max-w-[32ch] text-base leading-relaxed text-muted-foreground">
          A wall, a chair and your bodyweight. Log each session and watch the
          weeks stack up.
        </p>

        <div
          data-testid="week-strip"
          aria-hidden="true"
          className="mt-8 flex gap-1.5 md:gap-2"
        >
          {WEEK.map(({ day, state }, i) => (
            <i
              key={i}
              style={{ '--i': i } as React.CSSProperties}
              className={`tally-cell font-display flex h-14 flex-1 items-end rounded-sm p-1.5 text-lg leading-none font-bold not-italic md:h-20 md:p-2 ${cell[state]}`}
            >
              {day}
            </i>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:max-w-sm">
          <Link
            to="/library"
            className={`font-display flex min-h-14 cursor-pointer items-center justify-center rounded-sm bg-accent-fill text-2xl font-bold tracking-wider text-ink uppercase transition-colors duration-200 hover:bg-ink hover:text-background ${focusRing}`}
          >
            Browse exercises
          </Link>
          <Link
            to="/login"
            className={`flex min-h-12 cursor-pointer items-center justify-center text-base text-muted-foreground underline underline-offset-4 transition-colors duration-200 hover:text-foreground ${focusRing}`}
          >
            Sign in to track your weeks
          </Link>
        </div>

        <section className="mt-16 border-t-2 border-foreground pt-6">
          <h2 className="font-display text-3xl font-black tracking-wide uppercase">
            How it works
          </h2>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map(({ title, text, Icon }, i) => (
              <li key={title} className="flex gap-4 md:flex-col">
                <span
                  aria-hidden="true"
                  className="font-display text-6xl leading-none font-black text-accent-text"
                >
                  0{i + 1}
                </span>
                <div>
                  <p className="flex items-center gap-2 font-display text-2xl font-bold tracking-wide uppercase">
                    <Icon aria-hidden="true" className="size-5 shrink-0" />
                    {title}
                  </p>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-16 grid gap-4 md:grid-cols-2">
          <section className="rounded-sm bg-foreground p-6 text-background">
            <h2 className="font-display text-3xl font-black tracking-wide uppercase">
              Weeks, not days
            </h2>
            <p className="mt-2 text-base leading-relaxed">
              Your streak counts weeks, starting Monday. No reminders, no guilt
              screens. Just a quiet tally.
            </p>
          </section>
          <section className="rounded-sm bg-cell p-6">
            <h2 className="font-display text-3xl font-black tracking-wide uppercase">
              Fits what you own
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Tell it what you have at home. Exercises that need other gear stay
              out of your suggestions.
            </p>
          </section>
        </div>

        <section className="mt-16 flex flex-col gap-4 border-t-2 border-foreground pt-6 md:flex-row md:items-center md:justify-between">
          <p className="font-display text-4xl leading-none font-black uppercase">
            Start with the <span className="text-accent-text">library.</span>
          </p>
          <Link
            to="/library"
            className={`font-display flex min-h-14 cursor-pointer items-center justify-center rounded-sm bg-accent-fill px-8 text-2xl font-bold tracking-wider text-ink uppercase transition-colors duration-200 hover:bg-ink hover:text-background ${focusRing}`}
          >
            See the exercise library
          </Link>
        </section>
      </main>
    </div>
  )
}
