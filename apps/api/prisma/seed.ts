import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
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
      display_name: "สมชาย ผู้ซื้อ",
      kyc_level: "basic",
      line_sub: "LINE_BUYER_001",
    },
  });

  const seller = await prisma.user.create({
    data: {
      id: "seller-001",
      role: "seller",
      email: "seller@example.com",
      display_name: "สมหญิง ผู้ขาย",
      kyc_level: "basic",
      line_sub: "LINE_SELLER_001",
      seller_profile: {
        create: {
          verified: true,
          kyc_status: "verified",
          promptpay_id: "0812345678",
          promptpay_name: "สมหญิง ผู้ขาย",
          reputation_score: 4.5,
          selfie_url: "https://example.com/uploads/selfie-seller.jpg",
        },
      },
    },
  });

  const admin = await prisma.user.create({
    data: {
      id: "admin-001",
      role: "admin",
      email: "admin@example.com",
      display_name: "Admin User",
      kyc_level: "full",
      line_sub: "LINE_ADMIN_001",
    },
  });

  console.log("✅ Created users:", { buyer: buyer.id, seller: seller.id, admin: admin.id });

  // Create deals in various states

  // Deal 1: PENDING (waiting for payment)
  const deal1 = await prisma.deal.create({
    data: {
      id: "deal-pending-001",
      title: "iPhone 13 Pro มือสอง สภาพดี",
      amount_satang: 2500000, // 25,000 THB
      currency: "THB",
      seller_id: seller.id,
      status: "PENDING",
      paylink_token: "paylink-pending-001",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      buyer_note: "ต้องการสีน้ำเงิน ส่งไว ๆ นะคะ",
    },
  });

  // Deal 2: HOLD (paid, waiting for shipment)
  const deal2 = await prisma.deal.create({
    data: {
      id: "deal-hold-001",
      title: "MacBook Air M2 ใหม่กริ๊บ",
      amount_satang: 3800000, // 38,000 THB
      currency: "THB",
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "HOLD",
      paylink_token: "paylink-hold-001",
      buyer_note: "ขอใบเสร็จด้วยครับ",
      payments: {
        create: {
          provider: "mock_promptpay",
          provider_ref: "MOCK_PP_HOLD_001",
          status: "PAID",
          amount_satang: 3800000,
          paid_at: new Date(),
        },
      },
    },
  });

  // Deal 3: SHIPPED (with tracking, waiting for confirmation)
  const deliveredAt = new Date();
  const autoReleaseAt = new Date(deliveredAt.getTime() + 48 * 60 * 60 * 1000); // 48 hours

  const deal3 = await prisma.deal.create({
    data: {
      id: "deal-shipped-001",
      title: "AirPods Pro Gen 2",
      amount_satang: 890000, // 8,900 THB
      currency: "THB",
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "SHIPPED",
      paylink_token: "paylink-shipped-001",
      tracking_number: "TH1234567890TH",
      courier: "Kerry Express",
      delivered_at: deliveredAt,
      auto_release_at: autoReleaseAt,
      payments: {
        create: {
          provider: "mock_promptpay",
          provider_ref: "MOCK_PP_SHIPPED_001",
          status: "PAID",
          amount_satang: 890000,
          paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  // Deal 4: DISPUTE (buyer opened dispute)
  const deal4 = await prisma.deal.create({
    data: {
      id: "deal-dispute-001",
      title: "Samsung Galaxy S23 Ultra",
      amount_satang: 3200000, // 32,000 THB
      currency: "THB",
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "DISPUTE",
      paylink_token: "paylink-dispute-001",
      tracking_number: "TH9876543210TH",
      courier: "Flash Express",
      payments: {
        create: {
          provider: "mock_promptpay",
          provider_ref: "MOCK_PP_DISPUTE_001",
          status: "PAID",
          amount_satang: 3200000,
          paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      },
      disputes: {
        create: {
          opened_by: buyer.id,
          reason: "item_mismatch",
          reason_text: "สินค้าที่ได้รับไม่ตรงกับรูป มีรอยขีดข่วนหลายจุด ไม่ใช่สภาพดีเยี่ยมตามที่บอก",
          status: "OPEN",
          evidence: {
            create: [
              {
                uploaded_by: buyer.id,
                kind: "image",
                url: "https://example.com/uploads/evidence-1.jpg",
                note: "รอยขีดข่วนที่หน้าจอ",
              },
              {
                uploaded_by: buyer.id,
                kind: "image",
                url: "https://example.com/uploads/evidence-2.jpg",
                note: "รอยบุบที่ขอบเครื่อง",
              },
            ],
          },
        },
      },
    },
  });

  // Deal 5: RELEASED (completed successfully)
  const deal5 = await prisma.deal.create({
    data: {
      id: "deal-released-001",
      title: "PlayStation 5 + 2 จอย",
      amount_satang: 1890000, // 18,900 THB
      currency: "THB",
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: "RELEASED",
      paylink_token: "paylink-released-001",
      tracking_number: "TH5555555555TH",
      courier: "Thailand Post EMS",
      delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      payments: {
        create: {
          provider: "mock_promptpay",
          provider_ref: "MOCK_PP_RELEASED_001",
          status: "PAID",
          amount_satang: 1890000,
          paid_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  console.log("✅ Created deals:", {
    pending: deal1.id,
    hold: deal2.id,
    shipped: deal3.id,
    dispute: deal4.id,
    released: deal5.id,
  });

  // Add reputation events for seller
  await prisma.reputationEvent.createMany({
    data: [
      {
        seller_id: seller.seller_profile!.id,
        type: "positive",
        weight: 1.0,
        note: "Deal completed successfully",
      },
      {
        seller_id: seller.seller_profile!.id,
        type: "positive",
        weight: 1.0,
        note: "Fast shipping",
      },
      {
        seller_id: seller.seller_profile!.id,
        type: "negative",
        weight: -0.5,
        note: "Dispute opened",
      },
    ],
  });

  // Add deal events for audit trail
  await prisma.dealEvent.createMany({
    data: [
      {
        deal_id: deal2.id,
        event_type: "created",
        to_status: "PENDING",
        actor_id: seller.id,
      },
      {
        deal_id: deal2.id,
        event_type: "paid",
        from_status: "PENDING",
        to_status: "HOLD",
        actor_id: buyer.id,
      },
      {
        deal_id: deal3.id,
        event_type: "shipped",
        from_status: "HOLD",
        to_status: "SHIPPED",
        actor_id: seller.id,
        metadata: JSON.stringify({ tracking: "TH1234567890TH", courier: "Kerry Express" }),
      },
      {
        deal_id: deal4.id,
        event_type: "disputed",
        from_status: "SHIPPED",
        to_status: "DISPUTE",
        actor_id: buyer.id,
      },
      {
        deal_id: deal5.id,
        event_type: "released",
        from_status: "SHIPPED",
        to_status: "RELEASED",
        actor_id: buyer.id,
      },
    ],
  });

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
