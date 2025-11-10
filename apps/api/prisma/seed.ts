import { PrismaClient, DealStatus, PaymentStatus, DisputeStatus, EvidenceKind } from '@prisma/client';
import { ulid } from 'ulid';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

async function main() {
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      displayName: 'คุณผู้ซื้อ',
      role: 'buyer',
      kycLevel: 'basic'
    }
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: {},
    create: {
      email: 'seller@example.com',
      displayName: 'คุณผู้ขาย',
      role: 'seller',
      kycLevel: 'full'
    }
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      displayName: 'ผู้ดูแลระบบ',
      role: 'admin',
      kycLevel: 'full'
    }
  });

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {},
    create: {
      userId: seller.id,
      verified: true,
      promptpayId: '0800000000',
      promptpayName: 'คุณผู้ขาย',
      kycStatus: 'verified',
      reputationScore: 0.8
    }
  });

  const dealsData = [
    {
      id: ulid(),
      title: 'Nike Dunk มือสองสภาพใหม่',
      amountSatang: 250000,
      sellerId: seller.id,
      sellerProfileId: sellerProfile.id,
      status: DealStatus.PENDING,
      paylinkToken: ulid(),
      expiresAt: dayjs().add(5, 'day').toDate()
    },
    {
      id: ulid(),
      title: 'iPhone 13 Pro Max',
      amountSatang: 3200000,
      sellerId: seller.id,
      sellerProfileId: sellerProfile.id,
      status: DealStatus.HOLD,
      buyerId: buyer.id,
      paylinkToken: ulid(),
      expiresAt: dayjs().add(3, 'day').toDate(),
      payments: {
        create: {
          provider: 'mock_promptpay',
          providerRef: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          status: PaymentStatus.PAID,
          paidAt: new Date()
        }
      }
    },
    {
      id: ulid(),
      title: 'คอมประกอบสำหรับสตรีมมิ่ง',
      amountSatang: 4500000,
      sellerId: seller.id,
      sellerProfileId: sellerProfile.id,
      status: DealStatus.DISPUTE,
      buyerId: buyer.id,
      paylinkToken: ulid(),
      trackingNumber: 'TH1234567890',
      courier: 'Thailand Post',
      deliveredAt: dayjs().subtract(2, 'day').toDate(),
      autoReleaseAt: dayjs().add(2, 'hour').toDate(),
      expiresAt: dayjs().add(2, 'day').toDate(),
      payments: {
        create: {
          provider: 'mock_promptpay',
          providerRef: `MOCK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          status: PaymentStatus.PAID,
          paidAt: dayjs().subtract(3, 'day').toDate()
        }
      }
    }
  ];

  for (const deal of dealsData) {
    await prisma.deal.upsert({
      where: { id: deal.id },
      update: {},
      create: deal
    });
  }

  const disputeDeal = dealsData[2];

  const dispute = await prisma.dispute.upsert({
    where: { dealId: disputeDeal.id },
    update: {},
    create: {
      dealId: disputeDeal.id,
      openedById: buyer.id,
      reasonText: 'ของไม่ตรงปก',
      status: DisputeStatus.OPEN
    }
  });

  await prisma.evidence.createMany({
    data: [
      {
        disputeId: dispute.id,
        uploadedById: buyer.id,
        kind: EvidenceKind.image,
        url: 'https://example.com/evidence1.jpg',
        note: 'รูปสินค้าที่ได้รับ'
      },
      {
        disputeId: dispute.id,
        uploadedById: buyer.id,
        kind: EvidenceKind.chatlog,
        url: 'https://example.com/chatlog.pdf',
        note: 'บทสนทนาใน LINE'
      }
    ],
    skipDuplicates: true
  });

  console.log('Seed complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
