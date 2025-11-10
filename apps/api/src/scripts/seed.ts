import { prisma } from "../config/database";
import { generateULID, generatePaylinkToken } from "../utils/ulid";

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.dealEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.reputationEvent.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const buyer = await prisma.user.create({
    data: {
      id: "buyer-001",
      role: "buyer",
      email: "buyer@example.com",
      displayName: "ผู้ซื้อทดสอบ",
      kycLevel: "none",
    },
  });

  const seller = await prisma.user.create({
    data: {
      id: "seller-001",
      role: "seller",
      email: "seller@example.com",
      displayName: "ผู้ขายทดสอบ",
      kycLevel: "basic",
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: "admin-001",
      role: "admin",
      email: "admin@example.com",
      displayName: "ผู้ดูแลระบบ",
      kycLevel: "full",
    },
  });

  // Create seller profile (verified)
  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      verified: true,
      promptpayId: "0812345678",
      promptpayName: "ผู้ขายทดสอบ",
      kycStatus: "verified",
      reputationScore: 0.85,
    },
  });

  // Create deals
  const deal1 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: "iPhone 14 Pro Max 256GB",
      amountSatang: 45000 * 100, // 45,000 THB
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "HOLD",
      paylinkToken: generatePaylinkToken(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: "MacBook Air M2",
      amountSatang: 35000 * 100, // 35,000 THB
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "SHIPPED",
      paylinkToken: generatePaylinkToken(),
      trackingNumber: "TH123456789",
      courier: "Kerry",
      deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      autoReleaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: "AirPods Pro 2",
      amountSatang: 8000 * 100, // 8,000 THB
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "RELEASED",
      paylinkToken: generatePaylinkToken(),
      trackingNumber: "TH987654321",
      courier: "J&T",
      deliveredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      dealId: deal1.id,
      provider: "mock_promptpay",
      providerRef: "MOCK_PAY_001",
      status: "PAID",
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      dealId: deal2.id,
      provider: "mock_promptpay",
      providerRef: "MOCK_PAY_002",
      status: "PAID",
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      dealId: deal3.id,
      provider: "mock_promptpay",
      providerRef: "MOCK_PAY_003",
      status: "PAID",
      paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      dealId: deal1.id,
      openedBy: buyer.id,
      reasonText: "ของยังไม่ถึงตามที่ระบุ",
      status: "OPEN",
    },
  });

  // Create evidence
  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      url: "https://example.com/evidence1.jpg",
      kind: "image",
      note: "รูปภาพการส่งของ",
    },
  });

  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      url: "https://example.com/chatlog.txt",
      kind: "chatlog",
      note: "บันทึกการสนทนา",
    },
  });

  // Create reputation events
  await prisma.reputationEvent.createMany({
    data: [
      {
        sellerId: seller.id,
        type: "positive",
        weight: 1.0,
        note: "Deal completed successfully",
      },
      {
        sellerId: seller.id,
        type: "positive",
        weight: 1.0,
        note: "Fast shipping",
      },
      {
        sellerId: seller.id,
        type: "negative",
        weight: 1.0,
        note: "Dispute opened",
      },
    ],
  });

  console.log("✅ Seeding completed!");
  console.log(`   - Users: ${await prisma.user.count()}`);
  console.log(`   - Deals: ${await prisma.deal.count()}`);
  console.log(`   - Payments: ${await prisma.payment.count()}`);
  console.log(`   - Disputes: ${await prisma.dispute.count()}`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
