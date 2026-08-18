# Sprint 2 validation

This branch adds the first persistent demo-trading backend. It has not yet been validated against a live PostgreSQL instance in this environment.

Before merge, run locally:

```bash
cp .env.example .env
npm install
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name persistent_demo_core
npm run build
npm run test
```

Then manually verify:

1. Create a new account at `/register`.
2. Confirm the account starts with 10,000 RP demo credits.
3. Sign out and back in; confirm the balance persists.
4. Open a 30-second UP or DOWN demo trade.
5. Confirm the stake is reserved immediately.
6. After expiry, refresh/poll the portfolio and confirm the trade settles once as WON, LOST, or DRAW.
7. Confirm the ledger-derived balance reflects the settlement.
8. Repeat the same POST payload with the same idempotency key and confirm no duplicate trade is created.

## Known release gate

`package.json` changed in this sprint. Regenerate and commit `package-lock.json` after `npm install` before merging.
