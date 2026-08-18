# Regnant Pocket

Regnant Pocket is a **Next.js 14 + TypeScript + Prisma + PostgreSQL** demo trading platform for the Regnant ecosystem.

The current repository branch implements a simulation-only UP/DOWN terminal with persistent users, sessions, RP demo credits, deterministic demo market data, an append-only double-entry ledger, demo trade settlement, tests, migrations, and CI validation.

## Demo-only scope

- No real-money deposits or withdrawals
- No broker or exchange execution
- No payment processing
- No investment signals or financial advice
- RP credits have no monetary value

## Local setup

```bash
cp .env.example .env
npm install
npm run db:generate
npm run db:validate
npm run db:migrate
npm run dev
```

A reachable PostgreSQL database must be configured in `DATABASE_URL` before running the migration.

## Validation

```bash
npm test
npm run typecheck
npm run build
```

Integration tests require PostgreSQL and `RUN_DB_TESTS=1`.

## Database releases

Development migrations are created with `npm run db:migrate`. Release environments should apply checked-in migrations with:

```bash
npx prisma migrate deploy
```

## Architecture note

The current terminal uses `UP` / `DOWN` demo trades. The original repository also contains older LONG/SHORT portfolio helpers. Those legacy types are intentionally isolated under `types/legacy-trading.ts` and must not be used by the current demo-order lifecycle.
