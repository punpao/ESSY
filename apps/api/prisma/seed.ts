import { PrismaClient } from '@prisma/client';
import { generateULID, generatePaylinkToken } from '@thai-escrow/core';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@escrow.local' },
    update: {},
    create: {
      email: 'admin@escrow.local',
      display_name: 'Admin User',
      role: 'admin',
      kyc_level: 'full',
    },
  });

  console.log('✅ Created admin:', admin.email);

  // Create verified seller
  const seller = await prisma.user.upsert({
    where: { email: 'seller@escrow.local' },
    update: {},
    create: {
      email: 'seller@escrow.local',
      display_name: 'Verified Seller',
      role: 'seller',
      kyc_level: 'basic',
    },
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { user_id: seller.id },
    update: {},
    create: {
      user_id: seller.id,
      promptpay_id: '0812345678',
      promptpay_name: 'นาย ขายของ ดี',
      verified: true,
      kyc_status: 'verified',
      reputation_score: 75,
    },
  });

  console.log('✅ Created seller:', seller.email);

  // Create buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@escrow.local' },
    update: {},
    create: {
      email: 'buyer@escrow.local',
      display_name: 'Test Buyer',
      role: 'buyer',
      kyc_level: 'none',
    },
  });

  console.log('✅ Created buyer:', buyer.email);

  // Create demo deals

  // Deal 1: PENDING (waiting for payment)
  const deal1 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: 'iPhone 14 Pro มือสอง สภาพดีมาก',
      amount_satang: 2500000, // 25,000 THB
      currency: 'THB',
      seller_id: seller.id,
      status: 'PENDING',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.dealEvent.create({
    data: {
      deal_id: deal1.id,
      event_type: 'created',
      to_status: 'PENDING',
      actor_id: seller.id,
    },
  });

  console.log('✅ Created deal 1 (PENDING):', deal1.title);

  // Deal 2: HOLD (payment received, waiting for shipping)
  const deal2 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: 'MacBook Air M2 ประกันเหลือ 1 ปี',
      amount_satang: 3200000, // 32,000 THB
      currency: 'THB',
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: 'HOLD',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      deal_id: deal2.id,
      provider: 'mock_promptpay',
      provider_ref: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'PAID',
      paid_at: new Date(),
    },
  });

  await prisma.dealEvent.create({
    data: {
      deal_id: deal2.id,
      event_type: 'payment_received',
      from_status: 'PENDING',
      to_status: 'HOLD',
      actor_id: buyer.id,
    },
  });

  console.log('✅ Created deal 2 (HOLD):', deal2.title);

  // Deal 3: SHIPPED (in transit)
  const deliveredAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
  const autoReleaseAt = new Date(deliveredAt.getTime() + 48 * 60 * 60 * 1000); // 48h after delivery

  const deal3 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: 'AirPods Pro Gen 2 ของแท้ศูนย์ไทย',
      amount_satang: 850000, // 8,500 THB
      currency: 'THB',
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: 'SHIPPED',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tracking_number: 'TH1234567890',
      courier: 'Kerry Express',
      delivered_at: deliveredAt,
      auto_release_at: autoReleaseAt,
    },
  });

  await prisma.payment.create({
    data: {
      deal_id: deal3.id,
      provider: 'mock_promptpay',
      provider_ref: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'PAID',
      paid_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Paid 1 day ago
    },
  });

  await prisma.dealEvent.create({
    data: {
      deal_id: deal3.id,
      event_type: 'shipped',
      from_status: 'HOLD',
      to_status: 'SHIPPED',
      actor_id: seller.id,
      metadata: JSON.stringify({ trackingNumber: 'TH1234567890', courier: 'Kerry Express' }),
    },
  });

  console.log('✅ Created deal 3 (SHIPPED):', deal3.title);

  // Deal 4: DISPUTE (buyer opened dispute)
  const deal4 = await prisma.deal.create({
    data: {
      id: generateULID(),
      title: 'Nintendo Switch OLED + 3 เกม',
      amount_satang: 1200000, // 12,000 THB
      currency: 'THB',
      seller_id: seller.id,
      buyer_id: buyer.id,
      status: 'DISPUTE',
      paylink_token: generatePaylinkToken(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tracking_number: 'TH9876543210',
      courier: 'Flash Express',
    },
  });

  await prisma.payment.create({
    data: {
      deal_id: deal4.id,
      provider: 'mock_promptpay',
      provider_ref: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'PAID',
      paid_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Paid 3 days ago
    },
  });

  const dispute = await prisma.dispute.create({
    data: {
      deal_id: deal4.id,
      opened_by: buyer.id,
      reason_text: 'ได้รับสินค้าแล้วแต่ไม่ตรงตามที่โฆษณาไว้ Switch มีรอยขีดข่วนที่หน้าจอ',
      status: 'OPEN',
    },
  });

  await prisma.evidence.createMany({
    data: [
      {
        dispute_id: dispute.id,
        uploaded_by: buyer.id,
        kind: 'image',
        url: 'https://example.com/evidence/photo1.jpg',
        note: 'รูปรอยขีดข่วนบนหน้าจอ',
      },
      {
        dispute_id: dispute.id,
        uploaded_by: buyer.id,
        kind: 'chatlog',
        url: 'https://example.com/evidence/chat.txt',
        note: 'บทสนทนากับผู้ขายก่อนซื้อ',
      },
    ],
  });

  await prisma.dealEvent.create({
    data: {
      deal_id: deal4.id,
      event_type: 'dispute_opened',
      from_status: 'SHIPPED',
      to_status: 'DISPUTE',
      actor_id: buyer.id,
      metadata: JSON.stringify({ disputeId: dispute.id }),
    },
  });

  console.log('✅ Created deal 4 (DISPUTE):', deal4.title);

  // Create reputation events for seller
  await prisma.reputationEvent.createMany({
    data: [
      {
        seller_id: sellerProfile.id,
        type: 'positive',
        weight: 1.0,
        note: 'Completed deal successfully',
      },
      {
        seller_id: sellerProfile.id,
        type: 'positive',
        weight: 1.0,
        note: 'Completed deal successfully',
      },
      {
        seller_id: sellerProfile.id,
        type: 'positive',
        weight: 1.0,
        note: 'Completed deal successfully',
      },
    ],
  });

  console.log('✅ Created reputation events');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📧 Demo accounts:');
  console.log('   Admin:  admin@escrow.local');
  console.log('   Seller: seller@escrow.local (verified)');
  console.log('   Buyer:  buyer@escrow.local');
  console.log('\n💡 Use email OTP login with any 6-digit code (check console logs)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
