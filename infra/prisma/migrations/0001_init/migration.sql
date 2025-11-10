CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE "KycLevel" AS ENUM ('none', 'basic', 'full');
CREATE TYPE "KycStatus" AS ENUM ('unverified', 'pending', 'verified');
CREATE TYPE "DealStatus" AS ENUM ('PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND');
CREATE TYPE "PaymentProvider" AS ENUM ('mock_promptpay');
CREATE TYPE "PaymentStatus" AS ENUM ('INIT', 'PAID', 'REFUNDED', 'FAILED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE');
CREATE TYPE "ReputationType" AS ENUM ('positive', 'neutral', 'negative');
CREATE TYPE "EvidenceKind" AS ENUM ('image', 'chatlog', 'other');

-- CreateTable User
CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "role" "UserRole" NOT NULL,
  "lineSub" TEXT UNIQUE,
  "email" TEXT UNIQUE NOT NULL,
  "phone" TEXT,
  "kycLevel" "KycLevel" NOT NULL DEFAULT 'none',
  "displayName" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SellerProfile
CREATE TABLE "SellerProfile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE NOT NULL,
  "verified" BOOLEAN NOT NULL DEFAULT FALSE,
  "promptpayId" TEXT NOT NULL,
  "promptpayName" TEXT NOT NULL,
  "selfieUrl" TEXT,
  "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "kycStatus" "KycStatus" NOT NULL DEFAULT 'unverified',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE INDEX "SellerProfile_verified_idx" ON "SellerProfile"("verified");

-- Deal
CREATE TABLE "Deal" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "buyerNote" TEXT,
  "amountSatang" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "sellerId" UUID NOT NULL,
  "buyerId" UUID,
  "status" "DealStatus" NOT NULL DEFAULT 'PENDING',
  "paylinkToken" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "trackingNumber" TEXT,
  "courier" TEXT,
  "deliveredAt" TIMESTAMPTZ,
  "autoReleaseAt" TIMESTAMPTZ,
  "cancelledReason" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Deal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE,
  CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX "Deal_status_idx" ON "Deal"("status");
CREATE INDEX "Deal_seller_status_idx" ON "Deal"("sellerId", "status");
CREATE INDEX "Deal_auto_release_idx" ON "Deal"("autoReleaseAt");

-- Payment
CREATE TABLE "Payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dealId" TEXT NOT NULL UNIQUE,
  "provider" "PaymentProvider" NOT NULL,
  "providerRef" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL,
  "paidAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Payment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- Dispute
CREATE TABLE "Dispute" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dealId" TEXT NOT NULL UNIQUE,
  "openedById" UUID NOT NULL,
  "reasonText" TEXT NOT NULL,
  "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
  "resolutionNote" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "resolvedAt" TIMESTAMPTZ,
  CONSTRAINT "Dispute_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE,
  CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Evidence
CREATE TABLE "Evidence" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "disputeId" UUID NOT NULL,
  "uploadedById" UUID NOT NULL,
  "kind" "EvidenceKind" NOT NULL,
  "url" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE,
  CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE CASCADE
);

-- ReputationEvent
CREATE TABLE "ReputationEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "sellerId" UUID NOT NULL,
  "type" "ReputationType" NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "ReputationEvent_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- DealEvent
CREATE TABLE "DealEvent" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "dealId" TEXT NOT NULL,
  "event" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);
CREATE INDEX "DealEvent_dealId_idx" ON "DealEvent"("dealId");
