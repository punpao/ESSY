import { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      displayName: 'ผู้ซื้อทดสอบ',
      role: 'buyer',
      phone: '0812345678',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      displayName: 'ผู้ขายทดสอบ',
      role: 'seller',
      phone: '0823456789',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'ผู้ดูแลระบบ',
      role: 'admin',
    },
  });

  // Create verified seller profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      verified: true,
      promptpayId: '0812345678',
      promptpayName: 'ผู้ขายทดสอบ',
      kycStatus: 'verified',
      reputationScore: 85.5,
    },
  });

  // Create deals
  const deal1 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: 'iPhone 13 Pro Max 256GB',
      amountSatang: 3500000, // 35,000 THB
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'HOLD',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: 'MacBook Air M2 512GB',
      amountSatang: 4500000, // 45,000 THB
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'SHIPPED',
      paylinkToken: ulid(),
      trackingNumber: 'TH123456789',
      courier: 'Kerry Express',
      deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      autoReleaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: 'AirPods Pro 2',
      amountSatang: 800000, // 8,000 THB
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'DISPUTE',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      dealId: deal1.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_${Date.now()}_1`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      dealId: deal2.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_${Date.now()}_2`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  await prisma.payment.create({
    data: {
      dealId: deal3.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_${Date.now()}_3`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  // Create dispute with evidence
  const dispute = await prisma.dispute.create({
    data: {
      dealId: deal3.id,
      openedBy: buyer.id,
      reasonText: 'ของไม่ตรงปก ภาพที่ส่งมาไม่ตรงกับของจริง',
      status: 'OPEN',
    },
  });

  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: 'image',
      url: 'https://mock-s3.example.com/uploads/evidence1.jpg',
      note: 'ภาพของที่ได้รับ',
    },
  });

  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: 'chatlog',
      url: 'https://mock-s3.example.com/uploads/chatlog1.png',
      note: 'แชทกับผู้ขาย',
    },
  });

  // Create reputation events
  await prisma.reputationEvent.createMany({
    data: [
      {
        sellerId: sellerProfile.id,
        type: 'positive',
        weight: 10,
        note: 'Deal completed successfully',
      },
      {
        sellerId: sellerProfile.id,
        type: 'positive',
        weight: 8,
        note: 'Fast shipping',
      },
      {
        sellerId: sellerProfile.id,
        type: 'negative',
        weight: 5,
        note: 'One dispute opened',
      },
    ],
  });

  console.log('✅ Seeding completed!');
  console.log(`   - Users: buyer, seller (verified), admin`);
  console.log(`   - Deals: ${deal1.id} (HOLD), ${deal2.id} (SHIPPED), ${deal3.id} (DISPUTE)`);
  console.log(`   - Dispute: ${dispute.id} with 2 evidence items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
