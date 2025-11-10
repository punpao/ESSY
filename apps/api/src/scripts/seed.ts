import { prisma } from "../db";
import { ulid } from "ulid";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create users
  const buyer = await prisma.user.upsert({
    where: { email: "buyer@example.com" },
    update: {},
    create: {
      id: ulid(),
      email: "buyer@example.com",
      display_name: "ผู้ซื้อทดสอบ",
      role: "buyer",
      kyc_level: "none",
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: "seller@example.com" },
    update: {},
    create: {
      id: ulid(),
      email: "seller@example.com",
      display_name: "ผู้ขายทดสอบ",
      role: "seller",
      kyc_level: "basic",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      id: ulid(),
      email: "admin@example.com",
      display_name: "ผู้ดูแลระบบ",
      role: "admin",
      kyc_level: "full",
    },
  });

  // Create seller profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { user_id: seller.id },
    update: {},
    create: {
      id: ulid(),
      user_id: seller.id,
      verified: true,
      promptpay_id: "0812345678",
      promptpay_name: "ผู้ขายทดสอบ",
      reputation_score: 85.5,
      kyc_status: "verified",
    },
  });

  // Create deals
  const deal1 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "iPhone 13 Pro Max 256GB",
      amount_satang: 3500000, // 35,000 THB
      currency: "THB",
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "HOLD",
      paylink_token: ulid(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "AirPods Pro 2",
      amount_satang: 850000, // 8,500 THB
      currency: "THB",
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "SHIPPED",
      paylink_token: ulid(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tracking_number: "TH123456789",
      courier: "Kerry Express",
      delivered_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      auto_release_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "MacBook Pro M2",
      amount_satang: 5500000, // 55,000 THB
      currency: "THB",
      seller_id: seller.id,
      status: "PENDING",
      paylink_token: ulid(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      id: ulid(),
      deal_id: deal1.id,
      provider: "mock_promptpay",
      provider_ref: `MOCK_${Date.now()}_${deal1.id.slice(0, 8)}`,
      status: "PAID",
      paid_at: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      id: ulid(),
      deal_id: deal2.id,
      provider: "mock_promptpay",
      provider_ref: `MOCK_${Date.now()}_${deal2.id.slice(0, 8)}`,
      status: "PAID",
      paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      id: ulid(),
      deal_id: deal2.id,
      opened_by: buyer.id,
      reason_text: "ของยังไม่ถึงตามที่ระบุ",
      status: "OPEN",
    },
  });

  // Create evidence
  await prisma.evidence.create({
    data: {
      id: ulid(),
      dispute_id: dispute.id,
      uploaded_by: buyer.id,
      kind: "image",
      url: "https://mock-s3.com/evidence1.jpg",
      note: "ภาพหลักฐานการส่ง",
    },
  });

  await prisma.evidence.create({
    data: {
      id: ulid(),
      dispute_id: dispute.id,
      uploaded_by: buyer.id,
      kind: "chatlog",
      url: "https://mock-s3.com/chatlog.png",
      note: "แชทกับผู้ขาย",
    },
  });

  // Create reputation events
  await prisma.reputationEvent.createMany({
    data: [
      {
        id: ulid(),
        seller_id: seller.id,
        type: "positive",
        weight: 1.0,
        note: "Deal completed successfully",
      },
      {
        id: ulid(),
        seller_id: seller.id,
        type: "positive",
        weight: 0.8,
        note: "Fast shipping",
      },
      {
        id: ulid(),
        seller_id: seller.id,
        type: "negative",
        weight: -0.5,
        note: "Minor delay",
      },
    ],
  });

  console.log("✅ Seeding completed!");
  console.log(`   - Users: ${buyer.email}, ${seller.email}, ${admin.email}`);
  console.log(`   - Deals: 3 created`);
  console.log(`   - Disputes: 1 created`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
