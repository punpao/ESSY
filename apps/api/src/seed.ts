import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      id: ulid(),
      email: "buyer@example.com",
      displayName: "ผู้ซื้อทดสอบ",
      role: "buyer",
      kycLevel: "none",
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      id: ulid(),
      email: "seller@example.com",
      displayName: "ผู้ขายทดสอบ",
      role: "seller",
      kycLevel: "full",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: ulid(),
      email: "admin@example.com",
      displayName: "ผู้ดูแลระบบ",
      role: "admin",
      kycLevel: "full",
    },
  });

  // Create seller profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      id: ulid(),
      userId: seller.id,
      verified: true,
      promptpayId: "0812345678",
      promptpayName: "ผู้ขายทดสอบ",
      kycStatus: "verified",
      reputationScore: 85.5,
    },
  });

  // Create deals
  const deal1 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "iPhone 15 Pro Max 256GB",
      amountSatang: 4500000, // 45,000 THB
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "HOLD",
      paylinkToken: `pay_${ulid()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "MacBook Pro M3 14-inch",
      amountSatang: 6500000, // 65,000 THB
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "SHIPPED",
      paylinkToken: `pay_${ulid()}`,
      trackingNumber: "TH123456789",
      courier: "Kerry Express",
      deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      autoReleaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "AirPods Pro 2",
      amountSatang: 850000, // 8,500 THB
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "RELEASED",
      paylinkToken: `pay_${ulid()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      id: ulid(),
      dealId: deal1.id,
      provider: "mock_promptpay",
      providerRef: `MOCK_${Date.now()}_1`,
      status: "PAID",
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      id: ulid(),
      dealId: deal2.id,
      provider: "mock_promptpay",
      providerRef: `MOCK_${Date.now()}_2`,
      status: "PAID",
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      id: ulid(),
      dealId: deal3.id,
      provider: "mock_promptpay",
      providerRef: `MOCK_${Date.now()}_3`,
      status: "PAID",
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      id: ulid(),
      dealId: deal1.id,
      openedBy: buyer.id,
      reasonText: "ของยังไม่ถึงตามที่ระบุ",
      status: "OPEN",
    },
  });

  // Create evidence
  await prisma.evidence.create({
    data: {
      id: ulid(),
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: "image",
      url: "https://example.com/evidence1.jpg",
      note: "รูปภาพการส่งของ",
    },
  });

  await prisma.evidence.create({
    data: {
      id: ulid(),
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: "chatlog",
      url: "https://example.com/chatlog.png",
      note: "แชทกับผู้ขาย",
    },
  });

  // Create reputation events
  await prisma.reputationEvent.create({
    data: {
      id: ulid(),
      sellerId: sellerProfile.id,
      type: "positive",
      weight: 1.0,
      note: "Deal completed successfully",
    },
  });

  console.log("✅ Seeding completed!");
  console.log(`   Buyer: ${buyer.email}`);
  console.log(`   Seller: ${seller.email}`);
  console.log(`   Admin: ${admin.email}`);
  console.log(`   Deals: 3`);
  console.log(`   Disputes: 1`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
