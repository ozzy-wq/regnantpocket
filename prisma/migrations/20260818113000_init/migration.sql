-- CreateEnum
CREATE TYPE "TradeDirection" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('OPEN', 'WON', 'LOST', 'DRAW', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('USER_DEMO', 'TRADE_ESCROW', 'DEMO_TREASURY');

-- CreateEnum
CREATE TYPE "LedgerEntrySide" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DemoAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Instrument" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "payoutRatio" DECIMAL(10,6) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Instrument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DemoTrade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instrumentId" TEXT NOT NULL,
    "direction" "TradeDirection" NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'OPEN',
    "stake" DECIMAL(20,8) NOT NULL,
    "payoutRatio" DECIMAL(10,6) NOT NULL,
    "entryPrice" DECIMAL(24,10) NOT NULL,
    "settlementPrice" DECIMAL(24,10),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "settledAt" TIMESTAMP(3),
    "idempotencyKey" TEXT NOT NULL,
    CONSTRAINT "DemoTrade_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerAccount" (
    "id" TEXT NOT NULL,
    "demoAccountId" TEXT,
    "key" TEXT NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerTransaction" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT,
    "reference" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "side" "LedgerEntrySide" NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");
CREATE UNIQUE INDEX "DemoAccount_userId_key" ON "DemoAccount"("userId");
CREATE UNIQUE INDEX "Instrument_symbol_key" ON "Instrument"("symbol");
CREATE UNIQUE INDEX "DemoTrade_idempotencyKey_key" ON "DemoTrade"("idempotencyKey");
CREATE INDEX "DemoTrade_userId_status_openedAt_idx" ON "DemoTrade"("userId", "status", "openedAt");
CREATE INDEX "DemoTrade_instrumentId_expiresAt_idx" ON "DemoTrade"("instrumentId", "expiresAt");
CREATE UNIQUE INDEX "LedgerAccount_key_key" ON "LedgerAccount"("key");
CREATE INDEX "LedgerAccount_demoAccountId_type_idx" ON "LedgerAccount"("demoAccountId", "type");
CREATE UNIQUE INDEX "LedgerTransaction_reference_key" ON "LedgerTransaction"("reference");
CREATE INDEX "LedgerTransaction_tradeId_createdAt_idx" ON "LedgerTransaction"("tradeId", "createdAt");
CREATE INDEX "LedgerEntry_accountId_createdAt_idx" ON "LedgerEntry"("accountId", "createdAt");
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemoAccount" ADD CONSTRAINT "DemoAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DemoTrade" ADD CONSTRAINT "DemoTrade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DemoTrade" ADD CONSTRAINT "DemoTrade_instrumentId_fkey" FOREIGN KEY ("instrumentId") REFERENCES "Instrument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerAccount" ADD CONSTRAINT "LedgerAccount_demoAccountId_fkey" FOREIGN KEY ("demoAccountId") REFERENCES "DemoAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "DemoTrade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
