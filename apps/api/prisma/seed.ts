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
      displayName: 'ผู้ซื้อ ทดสอบ',
      role: 'buyer',
      kycLevel: 'none',
    },
  });
  console.log('✅ Created buyer:', buyer.email);

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      displayName: 'ร้านค้า ทดสอบ',
      role: 'seller',
      kycLevel: 'basic',
    },
  });
  console.log('✅ Created seller:', seller.email);

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
  console.log('✅ Created admin:', admin.email);

  // Create seller profile
  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      verified: true,
      promptpayId: '0899999999',
      promptpayName: 'ร้านค้า ทดสอบ',
      kycStatus: 'verified',
      reputationScore: 85.5,
    },
  });
  console.log('✅ Created seller profile (verified)');

  // Create deals in various states
  const deal1 = await prisma.deal.create({
    data: {
      title: 'iPhone 14 Pro มือสอง สภาพดี 95%',
      amountSatang: 3500000, // 35,000 THB
      currency: 'THB',
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'HOLD',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Created deal 1 (HOLD):', deal1.title);

  // Create payment for deal 1
  await prisma.payment.create({
    data: {
      dealId: deal1.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_PP_${ulid()}`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  const deal2 = await prisma.deal.create({
    data: {
      title: 'MacBook Air M2 2023 ประกันเหลือ',
      amountSatang: 4500000, // 45,000 THB
      currency: 'THB',
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'SHIPPED',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: 'TH123456789',
      courier: 'Kerry Express',
      autoReleaseAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Created deal 2 (SHIPPED):', deal2.title);

  await prisma.payment.create({
    data: {
      dealId: deal2.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_PP_${ulid()}`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  const deal3 = await prisma.deal.create({
    data: {
      title: 'iPad Pro 11" 256GB สีเทา',
      amountSatang: 2200000, // 22,000 THB
      currency: 'THB',
      sellerId: seller.id,
      status: 'PENDING',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  console.log('✅ Created deal 3 (PENDING):', deal3.title);

  // Create a deal with dispute
  const deal4 = await prisma.deal.create({
    data: {
      title: 'AirPods Pro รุ่น 2',
      amountSatang: 850000, // 8,500 THB
      currency: 'THB',
      sellerId: seller.id,
      buyerId: buyer.id,
      status: 'DISPUTE',
      paylinkToken: ulid(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      trackingNumber: 'TH987654321',
      courier: 'Thailand Post',
    },
  });
  console.log('✅ Created deal 4 (DISPUTE):', deal4.title);

  await prisma.payment.create({
    data: {
      dealId: deal4.id,
      provider: 'mock_promptpay',
      providerRef: `MOCK_PP_${ulid()}`,
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  // Create dispute for deal 4
  const dispute = await prisma.dispute.create({
    data: {
      dealId: deal4.id,
      openedBy: buyer.id,
      reasonText: 'ของที่ได้รับไม่ตรงตามรูปที่โพสต์ มีรอยขีดข่วนหลายจุด',
      status: 'OPEN',
    },
  });
  console.log('✅ Created dispute for deal 4');

  // Create evidence for dispute
  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: 'image',
      url: 'https://example.com/evidence/scratch1.jpg',
      note: 'รอยขีดข่วนด้านหลัง',
    },
  });

  await prisma.evidence.create({
    data: {
      disputeId: dispute.id,
      uploadedBy: buyer.id,
      kind: 'chatlog',
      url: 'https://example.com/evidence/chat.txt',
      note: 'บันทึกการสนทนากับผู้ขาย',
    },
  });
  console.log('✅ Created evidence for dispute');

  // Create reputation events
  await prisma.reputationEvent.createMany({
    data: [
      {
        sellerId: sellerProfile.id,
        type: 'positive',
        weight: 1.0,
        note: 'Completed deal successfully',
      },
      {
        sellerId: sellerProfile.id,
        type: 'positive',
        weight: 1.0,
        note: 'Completed deal successfully',
      },
      {
        sellerId: sellerProfile.id,
        type: 'positive',
        weight: 1.0,
        note: 'Completed deal successfully',
      },
      {
        sellerId: sellerProfile.id,
        type: 'neutral',
        weight: 0.5,
        note: 'Dispute resolved in seller favor',
      },
    ],
  });
  console.log('✅ Created reputation events');

  console.log('🎉 Seed completed!');
  console.log('\n📧 Demo credentials:');
  console.log('Buyer: buyer@example.com (OTP: any 6 digits)');
  console.log('Seller: seller@example.com (OTP: any 6 digits)');
  console.log('Admin: admin@example.com (OTP: any 6 digits)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
