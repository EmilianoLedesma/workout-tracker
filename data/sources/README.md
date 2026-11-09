# Vendored source data

## free-exercise-db.json

- Source: https://github.com/yuhonas/free-exercise-db (`dist/exercises.json`)
- Pinned commit: `f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5`
- Retrieved: 2026-11-09, 876 entries
- License: Unlicense, per the maintainer's statement (issue #2) and the README badge. The repository has no LICENSE file.
- Images: the maintainer states their origin and license are unknown. **Images are not used or copied by this project.** Only text and metadata are used.

Update:

```
SHA=$(gh api repos/yuhonas/free-exercise-db/commits/main --jq .sha)
curl -sL -o data/sources/free-exercise-db.json "https://raw.githubusercontent.com/yuhonas/free-exercise-db/$SHA/dist/exercises.json"
```

Then update the SHA and date above and run `npm run catalog:build`.

## Workout Guide

Not vendored. It is the dev dependency `@bryllim/workout-guide` (code MIT, artwork CC BY-SA 4.0), read from `node_modules` at build time.
