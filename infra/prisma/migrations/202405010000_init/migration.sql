-- Create Enums
CREATE TYPE "UserRole" AS ENUM ('buyer', 'seller', 'admin');
CREATE TYPE "DealStatus" AS ENUM ('PENDING', 'HOLD', 'SHIPPED', 'RELEASED', 'DISPUTE', 'REFUND');
CREATE TYPE "PaymentStatus" AS ENUM ('INIT', 'PAID', 'REFUNDED', 'FAILED');
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'NEED_MORE_INFO', 'RESOLVED_REFUND', 'RESOLVED_RELEASE');
CREATE TYPE "EvidenceKind" AS ENUM ('image', 'chatlog', 'other');
CREATE TYPE "KycLevel" AS ENUM ('none', 'basic', 'full');
CREATE TYPE "SellerKycStatus" AS ENUM ('unverified', 'pending', 'verified');
CREATE TYPE "ReputationType" AS ENUM ('positive', 'neutral', 'negative');

-- Users
CREATE TABLE "User" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "role" "UserRole" NOT NULL,
    "lineSub" TEXT UNIQUE,
    "email" TEXT NOT NULL UNIQUE,
    "phone" TEXT,
    "kycLevel" "KycLevel" NOT NULL DEFAULT 'none',
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SellerProfile
CREATE TABLE "SellerProfile" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL UNIQUE,
    "verified" BOOLEAN NOT NULL DEFAULT FALSE,
    "promptpayId" TEXT NOT NULL,
    "promptpayName" TEXT NOT NULL,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kycStatus" "SellerKycStatus" NOT NULL DEFAULT 'unverified',
    "selfieUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "SellerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "SellerProfile_verified_idx" ON "SellerProfile" ("verified");

-- Deals
CREATE TABLE "Deal" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "amountSatang" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "sellerId" UUID NOT NULL,
    "buyerId" UUID,
    "status" "DealStatus" NOT NULL,
    "paylinkToken" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "buyerNote" TEXT,
    "trackingNumber" TEXT,
    "courier" TEXT,
    "deliveredAt" TIMESTAMP WITH TIME ZONE,
    "autoReleaseAt" TIMESTAMP WITH TIME ZONE,
    "cancelledAt" TIMESTAMP WITH TIME ZONE,
    "cancelReason" TEXT,
    "releasedAt" TIMESTAMP WITH TIME ZONE,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "Deal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id"),
    CONSTRAINT "Deal_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id")
);

CREATE INDEX "Deal_status_idx" ON "Deal" ("status");

-- Payments
CREATE TABLE "Payment" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "status" "PaymentStatus" NOT NULL,
    "amountSatang" INTEGER NOT NULL,
    "paidAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "Payment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE
);

CREATE INDEX "Payment_status_idx" ON "Payment" ("status");

-- Disputes
CREATE TABLE "Dispute" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" TEXT NOT NULL,
    "openedById" UUID NOT NULL,
    "reasonText" TEXT NOT NULL,
    "reasonCode" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL,
    "resolutionNote" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    CONSTRAINT "Dispute_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE,
    CONSTRAINT "Dispute_openedById_fkey" FOREIGN KEY ("openedById") REFERENCES "User"("id")
);

-- Evidence
CREATE TABLE "Evidence" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "disputeId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "kind" "EvidenceKind" NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "Evidence_disputeId_fkey" FOREIGN KEY ("disputeId") REFERENCES "Dispute"("id") ON DELETE CASCADE,
    CONSTRAINT "Evidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
);

-- Reputation Events
CREATE TABLE "ReputationEvent" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "sellerId" UUID NOT NULL,
    "type" "ReputationType" NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "ReputationEvent_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "SellerProfile"("userId") ON DELETE CASCADE
);

-- Email OTP
CREATE TABLE "EmailOtp" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "consumedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deal Events
CREATE TABLE "DealEvent" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "dealId" TEXT NOT NULL,
    "status" "DealStatus" NOT NULL,
    "actorId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE,
    CONSTRAINT "DealEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id")
);
