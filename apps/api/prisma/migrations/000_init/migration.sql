CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('buyer', 'seller', 'admin');

CREATE TYPE "KycLevel" AS ENUM ('none', 'basic', 'full');

CREATE TYPE "KycStatus" AS ENUM ('unverified', 'pending', 'verified');

CREATE TYPE "DealStatus" AS ENUM ('PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND');

CREATE TYPE "PaymentStatus" AS ENUM ('INIT', 'PAID', 'REFUNDED', 'FAILED');

CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE');

CREATE TYPE "EvidenceKind" AS ENUM ('image', 'chatlog', 'other');

CREATE TYPE "ReputationEventType" AS ENUM ('positive', 'neutral', 'negative');

-- CreateTable User
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role" "UserRole" NOT NULL,
    "lineSub" TEXT UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "kycLevel" "KycLevel" NOT NULL DEFAULT 'none',
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CreateTable SellerProfile
CREATE TABLE "SellerProfile" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE,
    "verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "promptpayId" TEXT NOT NULL,
    "promptpayName" TEXT NOT NULL,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'unverified',
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CreateTable Deal
CREATE TABLE "Deal" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "amountSatang" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "sellerId" UUID NOT NULL,
    "buyerId" UUID,
    "status" "DealStatus" NOT NULL DEFAULT 'PENDING',
    "paylinkToken" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "buyerNote" TEXT,
    "trackingNumber" TEXT,
    "courier" TEXT,
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "autoReleaseAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CreateTable Payment
CREATE TABLE "Payment" (
    "id" TEXT PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INIT',
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT "Payment_provider_providerRef_key" UNIQUE ("provider", "providerRef")
);

-- CreateTable Dispute
CREATE TABLE "Dispute" (
    "id" TEXT PRIMARY KEY,
    "dealId" TEXT NOT NULL UNIQUE,
    "openedById" UUID NOT NULL,
    "reasonText" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    "resolvedAt" TIMESTAMP WITH TIME ZONE
);

-- CreateTable Evidence
CREATE TABLE "Evidence" (
    "id" TEXT PRIMARY KEY,
    "disputeId" TEXT NOT NULL,
    "uploadedById" UUID NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CreateTable ReputationEvent
CREATE TABLE "ReputationEvent" (
    "id" TEXT PRIMARY KEY,
    "sellerId" UUID NOT NULL,
    "type" "ReputationEventType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- CreateTable DealEvent
CREATE TABLE "DealEvent" (
    "id" TEXT PRIMARY KEY,
    "dealId" TEXT NOT NULL,
    "fromStatus" "DealStatus",
    "toStatus" "DealStatus" NOT NULL,
    "actorId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Relationships
ALTER TABLE "SellerProfile"
    ADD CONSTRAINT "SellerProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Deal"
    ADD CONSTRAINT "Deal_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Deal"
    ADD CONSTRAINT "Deal_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Dispute"
    ADD CONSTRAINT "Dispute_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Dispute"
    ADD CONSTRAINT "Dispute_openedById_fkey"
    FOREIGN KEY ("openedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Evidence"
    ADD CONSTRAINT "Evidence_disputeId_fkey"
    FOREIGN KEY ("disputeId") REFERENCES "Dispute" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Evidence"
    ADD CONSTRAINT "Evidence_uploadedById_fkey"
    FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReputationEvent"
    ADD CONSTRAINT "ReputationEvent_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "SellerProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DealEvent"
    ADD CONSTRAINT "DealEvent_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DealEvent"
    ADD CONSTRAINT "DealEvent_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "SellerProfile_verified_idx" ON "SellerProfile" ("verified");
CREATE INDEX "Deal_status_idx" ON "Deal" ("status");
CREATE INDEX "Deal_sellerId_idx" ON "Deal" ("sellerId");
CREATE INDEX "Deal_buyerId_idx" ON "Deal" ("buyerId");
CREATE INDEX "Payment_status_idx" ON "Payment" ("status");
CREATE INDEX "Dispute_status_idx" ON "Dispute" ("status");
CREATE INDEX "ReputationEvent_sellerId_idx" ON "ReputationEvent" ("sellerId");
CREATE INDEX "DealEvent_dealId_idx" ON "DealEvent" ("dealId");
CREATE INDEX "DealEvent_createdAt_idx" ON "DealEvent" ("createdAt");
