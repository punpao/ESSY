import { prisma } from '../db';
import { ulid } from 'ulid';

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
      kycLevel: 'none',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      displayName: 'ผู้ขายทดสอบ',
      role: 'seller',
      kycLevel: 'full',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'ผู้ดูแลระบบ',
      role: 'admin',
      kycLevel: 'full',
    },
  });

  // Create seller profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      verified: true,
      promptpayId: '0812345678',
      promptpayName: 'ผู้ขายทดสอบ',
      kycStatus: 'verified',
      reputationScore: 5.0,
    },
  });

  // Create deals
  const deal1 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: 'iPhone 13 Pro Max 256GB',
      amountSatang: 3500000, // 35,000 THB
      currency: 'THB',
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
      title: 'MacBook Air M2',
      amountSatang: 4500000, // 45,000 THB
      currency: 'THB',
      sellerId: seller.id,
      status: 'PENDING',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      id: ulid(),
      title: 'AirPods Pro 2',
      amountSatang: 800000, // 8,000 THB
      currency: 'THB',
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'RELEASED',
      paylinkToken: ulid(),
      trackingNumber: 'TH123456789',
      courier: 'Kerry',
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      dealId: deal1.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_${deal1.id}`,
      status: 'PAID',
      paidAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.payment.create({
    data: {
      dealId: deal2.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_${deal2.id}`,
      status: 'INIT',
    },
  });

  await prisma.payment.create({
    data: {
      dealId: deal3.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_${deal3.id}`,
      status: 'PAID',
      paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      dealId: deal1.id,
      openedBy: buyer.id,
      reasonText: 'ของยังไม่ถึงตามที่ระบุ',
      status: 'OPEN',
    },
  });

  // Create evidence
  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: 'image',
      url: 'https://example.com/evidence1.jpg',
      note: 'รูปภาพการจัดส่ง',
    },
  });

  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: 'chatlog',
      url: 'https://example.com/chatlog.txt',
      note: 'บันทึกการสนทนา',
    },
  });

  // Update deal1 to DISPUTE status
  await prisma.deal.update({
    where: { id: deal1.id },
    data: { status: 'DISPUTE' },
  });

  console.log('✅ Seeding completed!');
  console.log(`   - Users: ${buyer.id}, ${seller.id}, ${admin.id}`);
  console.log(`   - Deals: ${deal1.id}, ${deal2.id}, ${deal3.id}`);
  console.log(`   - Dispute: ${dispute.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
