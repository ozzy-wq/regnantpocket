# Sprint 5 — Merge readiness and cleanup

This sprint reduces release ambiguity and separates legacy repository code from the current Regnant Pocket demo-trading architecture.

## Completed

- Removed the stale `package-lock.json` that did not contain the Prisma dependencies now declared in `package.json`.
- Kept CI on `npm install` until a fresh lockfile is generated from the current manifest.
- Isolated the original LONG/SHORT position types under `types/legacy-trading.ts`.
- Updated `lib/trade.ts` so legacy portfolio math no longer imports or pollutes the current UP/DOWN demo-trading contracts.
- Kept `types/trading.ts` dedicated to the current Regnant Pocket terminal model.
- Cleaned duplicate `.gitignore` entries and added local environment/test artifacts.
- Updated README branding, local setup, migration policy, demo-only scope and architecture notes.

## Lockfile policy before merge

A fresh lockfile should be generated from the current `package.json` in a trusted development environment and committed before the branch is treated as reproducible-release ready:

```bash
rm -rf node_modules
npm install
npm run db:generate
npm run db:validate
npm test
npm run typecheck
npm run build
git add package-lock.json
```

Do not restore the old lockfile. It predates the Prisma dependencies.

## Merge gate

Before merging to `main`, verify all of the following:

1. PostgreSQL is reachable through `DATABASE_URL`.
2. `npx prisma migrate deploy` succeeds on a clean database.
3. Unit and DB integration tests pass.
4. TypeScript passes with no errors.
5. `next build` completes successfully.
6. A fresh `package-lock.json` generated from the current manifest is committed.
7. The terminal can register/login, show 10,000 RP, open an UP/DOWN demo trade, settle it once, and refresh the ledger-derived balance.

Until these checks pass, the branch is feature-complete for the current foundation sprint but not release-validated.
