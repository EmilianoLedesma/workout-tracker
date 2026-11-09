# Personal Workout Tracker

## Problem

A sedentary beginner starting calisthenics at home has no simple place to follow a gentle routine and log what they did, so progress is invisible and the habit is easy to drop. Leaving it unsolved means no record of improvement and a higher chance of quitting.

## Evidence

- Assumption — needs validation via the owner's own use over the first 12 weeks.
- Why existing apps do not work for the owner: TBD — needs validation via the owner naming specific apps tried and what failed.

## Users

- **Primary**: the owner. Sedentary beginner, trains at home 3 times a week with bodyweight, a wall and a chair. Triggered by wanting to start and keep a training habit.
- **Not for**: athletes, coaches, social or multi-user use, anyone needing medical guidance.

## Hypothesis

We believe **a simple routine-and-logging app with a large exercise library and quiet weekly streaks** will **help a sedentary beginner keep training consistently** for **the owner**.
We'll know we're right when **the owner completes 3 sessions in at least 10 of the first 12 weeks** (target TBD — owner may pick a different metric).

## Success Metrics

| Metric                                          | Target   | How measured               |
| ----------------------------------------------- | -------- | -------------------------- |
| Weeks with 3+ sessions in the first 12 weeks    | 10 of 12 | Session history in the app |
| Sessions logged completely (every set recorded) | TBD      | Session history            |
| Owner still opens the app in week 12            | Yes      | Owner self-report          |

## Scope

**MVP** — Dashboard, exercise library, routines (with editable starter A/B/C), active workout logging, progress views, quiet gamification (weekly goal ring, week-based streak, milestone badges), settings, credits, online storage and sign-in, installable on a phone.

**Out of scope**

- Native apps — web first.
- Social features, leaderboards, XP/levels — conflicts with the quiet-gamification goal.
- Automatic training recommendations and progression — deferred to the roadmap.
- Offline session logging and sync — deferred.
- Multi-language UI — English only for now.
- Any medical claim or advice — the app records, it does not prescribe.

## Delivery Milestones

| #   | Milestone                 | Outcome                                                                                | Status  | Plan |
| --- | ------------------------- | -------------------------------------------------------------------------------------- | ------- | ---- |
| 1   | Foundation                | App opens on a phone, owner can sign in, navigation shell works                        | pending | —    |
| 2   | Catalog                   | Owner can browse, search and filter a large illustrated exercise library, with credits | pending | —    |
| 3   | Routines                  | Owner can use and edit starter A/B/C or build their own                                | pending | —    |
| 4   | Active workout            | Owner can run a session and save it                                                    | pending | —    |
| 5   | Progress and gamification | Owner sees history, charts, weekly ring, streak and badges                             | pending | —    |
| 6   | Offline and hardening     | Library works offline, data can be exported and imported, tested on mobile browsers    | pending | —    |

## Open Questions

- [ ] Which existing apps did the owner try, and why did they fail?
- [ ] Is "3 sessions in 10 of 12 weeks" the right success measure?
- [ ] Who else, if anyone, should eventually be able to use the app?

## Risks

| Risk                                                      | Likelihood | Impact | Mitigation                                                                     |
| --------------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------------------ |
| Exercise data or image licensing problems                 | Medium     | High   | Track source and license per item, ship only licensed images, show credits     |
| Starter routines too hard or unsafe-feeling for beginners | Medium     | High   | Gentle defaults, beginner level only from a source, disclaimer, fully editable |
| Owner loses interest without visible updates              | Medium     | Medium | Published roadmap and regular small releases                                   |
| Data loss from sync or connection problems                | Low        | High   | Keep in-progress session until saved, provide export                           |

---

_Status: DRAFT — requirements only. Implementation planning pending via /plan._
