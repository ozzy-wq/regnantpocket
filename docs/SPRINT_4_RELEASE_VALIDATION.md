# Sprint 4 — Migration and terminal hardening

## Implemented

- Added a checked-in baseline PostgreSQL migration under `prisma/migrations`.
- CI now applies migrations with `prisma migrate deploy` instead of relying on `prisma db push`.
- The migration matches the current Prisma schema, including the one-to-many trade-to-ledger-transaction relationship.
- Terminal loading states are explicit for markets, portfolio and quotes.
- Trade API error codes are translated into user-facing messages.
- Success notices are announced with `aria-live` and auto-dismiss.
- UP/DOWN buttons share a strict submit gate based on authentication, available balance, busy state and the 1–1,000 RP stake range.
- Empty market state, portfolio loading state, quote loading overlay and dismissible errors were added.

## Release gate

The branch is not release-validated until CI or equivalent local verification passes:

```bash
npm install
npm run db:generate
npm run db:validate
npx prisma migrate reset --force
npm test
npm run typecheck
npm run build
```

For staging/production, use:

```bash
npx prisma migrate deploy
```

Do not use `prisma db push` as the release migration strategy.
