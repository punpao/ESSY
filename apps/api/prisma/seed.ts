import { PrismaClient } from '@prisma/client';
import { generatePaylinkToken } from '@thai-escrow/core';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.dealEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.reputationEvent.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@example.com',
      display_name: 'นาย ผู้ซื้อ',
      role: 'buyer',
      kyc_level: 'none',
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: 'seller@example.com',
      display_name: 'นาง ผู้ขาย',
      role: 'seller',
      kyc_level: 'basic',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      display_name: 'ผู้ดูแลระบบ',
      role: 'admin',
      kyc_level: 'full',
    },
  });

  // Create seller profile
  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      user_id: seller.id,
      verified: true,
      promptpay_id: '0891234567',
      promptpay_name: 'นาง ผู้ขาย',
      kyc_status: 'verified',
      reputation_score: 75,
    },
  });

  // Add reputation events
  await prisma.reputationEvent.createMany({
    data: [
      {
        seller_id: sellerProfile.id,
        type: 'positive',
        weight: 0.3,
        note: 'Completed deal successfully',
      },
      {
        seller_id: sellerProfile.id,
        type: 'positive',
        weight: 0.3,
        note: 'Completed deal successfully',
      },
      {
        seller_id: sellerProfile.id,
        type: 'positive',
        weight: 0.3,
        note: 'Completed deal successfully',
      },
    ],
  });

  // Create deals in different states
  const deal1 = await prisma.deal.create({
    data: {
      title: 'iPhone 13 Pro Max 256GB มือสอง สภาพดี',
      amount_satang: 2500000, // 25,000 THB
      currency: 'THB',
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: 'HOLD',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      buyer_note: 'ต้องการรับสินค้าที่กรุงเทพฯ',
    },
  });

  await prisma.payment.create({
    data: {
      deal_id: deal1.id,
      provider: 'mock_promptpay',
      provider_ref: 'MOCK_PAID_001',
      status: 'PAID',
      paid_at: new Date(),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      title: 'MacBook Air M1 8GB/256GB',
      amount_satang: 3200000, // 32,000 THB
      currency: 'THB',
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: 'SHIPPED',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tracking_number: 'TH123456789',
      courier: 'Kerry Express',
      auto_release_at: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      deal_id: deal2.id,
      provider: 'mock_promptpay',
      provider_ref: 'MOCK_PAID_002',
      status: 'PAID',
      paid_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      title: 'AirPods Pro Gen 2',
      amount_satang: 750000, // 7,500 THB
      currency: 'THB',
      seller_id: seller.id,
      status: 'PENDING',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal4 = await prisma.deal.create({
    data: {
      title: 'Samsung Galaxy S23 Ultra',
      amount_satang: 3500000, // 35,000 THB
      currency: 'THB',
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: 'DISPUTE',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tracking_number: 'TH987654321',
      courier: 'Flash Express',
    },
  });

  await prisma.payment.create({
    data: {
      deal_id: deal4.id,
      provider: 'mock_promptpay',
      provider_ref: 'MOCK_PAID_003',
      status: 'PAID',
      paid_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Create dispute with evidence
  const dispute = await prisma.dispute.create({
    data: {
      deal_id: deal4.id,
      opened_by: buyer.id,
      reason: 'not_as_described',
      reason_text: 'สินค้าที่ได้รับไม่ตรงกับรูปที่โพสต์ มีรอยขีดข่วน',
      status: 'OPEN',
    },
  });

  await prisma.evidence.createMany({
    data: [
      {
        dispute_id: dispute.id,
        uploaded_by: buyer.id,
        kind: 'image',
        url: 'https://example.com/evidence1.jpg',
        note: 'รูปถ่ายสินค้าที่ได้รับ',
      },
      {
        dispute_id: dispute.id,
        uploaded_by: buyer.id,
        kind: 'chatlog',
        url: 'https://example.com/chat.txt',
        note: 'บันทึกการสนทนา LINE',
      },
    ],
  });

  // Create deal events
  await prisma.dealEvent.createMany({
    data: [
      {
        deal_id: deal1.id,
        event_type: 'deal_created',
        actor_id: seller.id,
      },
      {
        deal_id: deal1.id,
        event_type: 'payment_received',
        actor_id: buyer.id,
      },
      {
        deal_id: deal2.id,
        event_type: 'deal_created',
        actor_id: seller.id,
      },
      {
        deal_id: deal2.id,
        event_type: 'payment_received',
        actor_id: buyer.id,
      },
      {
        deal_id: deal2.id,
        event_type: 'tracking_added',
        actor_id: seller.id,
      },
    ],
  });

  console.log('✅ Seeding complete!');
  console.log('\n📝 Demo accounts:');
  console.log(`Buyer: ${buyer.email} (ID: ${buyer.id})`);
  console.log(`Seller: ${seller.email} (ID: ${seller.id})`);
  console.log(`Admin: ${admin.email} (ID: ${admin.id})`);
  console.log(`\n💰 Deals created: ${[deal1, deal2, deal3, deal4].length}`);
  console.log(`🔒 Paylink for deal3 (PENDING): ${config.app.baseUrl}/pay/${deal3.paylink_token}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

const config = {
  app: {
    baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  },
};
