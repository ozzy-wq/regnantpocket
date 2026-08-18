# Sprint 3 — Validation and hardening

This sprint focuses on correctness rather than new product features.

## Implemented

- Central ledger balance invariant checks.
- Positive ledger amount enforcement.
- Shared append-only balance calculation helper.
- Serializable transaction retry for Prisma `P2034` conflicts.
- Idempotency race recovery for Prisma `P2002` unique-key conflicts.
- Settlement claim remains atomic through `updateMany(... status: OPEN)`.
- Trade-to-ledger relationship supports multiple transactions per trade (open + settlement).
- Unit tests for ledger invariants.
- PostgreSQL integration coverage for repeated idempotency keys and double settlement.
- GitHub Actions CI with PostgreSQL 16, Prisma validation, tests, TypeScript and production build.
- Type compatibility restored for pre-existing dashboard code while the old LONG/SHORT modules are being phased out.

## CI database policy

CI currently uses `prisma db push` to validate the schema against an ephemeral PostgreSQL database. This is not the production deployment migration strategy. Before the first staging release, generate and review a checked-in baseline migration with `prisma migrate dev` and use `prisma migrate deploy` for release environments.

## Required local verification

```bash
npm install
npm run db:generate
npm run db:validate
npx prisma db push
npm test
npm run typecheck
npm run build
```

Do not claim the release is validated until these commands or the equivalent CI workflow pass.
