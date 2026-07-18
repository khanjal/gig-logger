# CLAUDE.md

Project conventions, architecture, and coding standards for this repo are documented in [.github/copilot-instructions.md](.github/copilot-instructions.md) — read it before making non-trivial changes. That file is the source of truth; this file only adds Claude-Code-specific notes.

## Quick reference

- Frontend: `npm start` (dev server), `npm run build:dev`, `npm run build:prod`
- Tests: `npm test -- --watch=false --browsers=ChromeHeadless`
- Zoneless check: `npm run check:zoneless-runtime`
- Always run frontend tests from the repo root (`c:\Users\khanj\Projects\gig-logger`)
- Backend Lambda: `cd amplify/backend/function/GigRaptorService && dotnet restore`, deploy via `npm run update-lambda`

## Key rules to not miss

- Zoneless Angular runtime — no `import 'zone.js'` in app runtime files; signals-first state.
- Use specialized button components (`app-base-fab`, `app-base-rect`, `app-base-icon`) — never `app-base-button` or embedded `<mat-icon>`.
- No magic strings/numbers — extract to `src/app/shared/constants/`.
- Public interfaces live in `src/app/shared/interfaces/`, one per file, `I`-prefixed.
- Use `import type` for type-only imports/exports.
- No `@deprecated` shims — fix usages at the point of discovery.
- Colors: semantic tokens/utilities only, always with dark mode variants — see the Color Standards section in copilot-instructions.md.
- Every new component/service/pipe/guard/helper ships with a matching `.spec.ts`.

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for full detail on all of the above.

## Efficiency notes

- While iterating, scope tests to the file(s) you're changing (`npm test -- --include='**/foo.spec.ts' --watch=false --browsers=ChromeHeadless`) rather than the full suite. Run the full suite before a commit.
- Only pass `--code-coverage` when coverage numbers are actually needed — it's slow and not needed for a normal pass/fail check.
- Keep this file thin — it's for commands and load-bearing rules only. Detailed conventions belong in `.github/copilot-instructions.md`, not duplicated here.

