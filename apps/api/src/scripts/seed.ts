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
      kyc_level: "full",
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
      title: "iPhone 15 Pro Max 256GB",
      amount_satang: 4500000, // 45,000 THB
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
      title: "MacBook Air M2",
      amount_satang: 3500000, // 35,000 THB
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "SHIPPED",
      paylink_token: ulid(),
      tracking_number: "TH123456789",
      courier: "Kerry Express",
      delivered_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      auto_release_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 48h after delivery
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "AirPods Pro 2",
      amount_satang: 800000, // 8,000 THB
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "RELEASED",
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
      provider_ref: `MOCK_${ulid()}`,
      status: "PAID",
      paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      id: ulid(),
      deal_id: deal2.id,
      provider: "mock_promptpay",
      provider_ref: `MOCK_${ulid()}`,
      status: "PAID",
      paid_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      id: ulid(),
      deal_id: deal3.id,
      provider: "mock_promptpay",
      provider_ref: `MOCK_${ulid()}`,
      status: "PAID",
      paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      id: ulid(),
      deal_id: deal1.id,
      opened_by: buyer.id,
      reason_text: "ของยังไม่ถึงตามที่ระบุ",
      status: "OPEN",
    },
  });

  // Create evidence
  await prisma.evidence.createMany({
    data: [
      {
        id: ulid(),
        dispute_id: dispute.id,
        uploaded_by: buyer.id,
        kind: "image",
        url: "https://example.com/evidence1.jpg",
        note: "รูปภาพของที่ได้รับ",
      },
      {
        id: ulid(),
        dispute_id: dispute.id,
        uploaded_by: buyer.id,
        kind: "chatlog",
        url: "https://example.com/chatlog.png",
        note: "แชทกับผู้ขาย",
      },
    ],
  });

  // Create reputation events
  await prisma.reputationEvent.createMany({
    data: [
      {
        id: ulid(),
        seller_id: seller.id,
        type: "positive",
        weight: 0.3,
        note: "Deal completed successfully",
      },
      {
        id: ulid(),
        seller_id: seller.id,
        type: "positive",
        weight: 0.3,
        note: "Fast shipping",
      },
    ],
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
