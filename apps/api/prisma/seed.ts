import { PrismaClient, DealStatus, DisputeStatus, PaymentStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
  await prisma.dealEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      role: 'admin',
      email: 'ops@escrow.local',
      displayName: 'Escrow Ops',
      kycLevel: 'full',
    },
  });

  const seller = await prisma.user.create({
    data: {
      role: 'seller',
      email: 'seller@escrow.local',
      displayName: 'ร้านพี่มีของแท้',
      kycLevel: 'basic',
    },
  });

  const buyer = await prisma.user.create({
    data: {
      role: 'buyer',
      email: 'buyer@escrow.local',
      displayName: 'คุณลูกค้า',
      kycLevel: 'basic',
    },
  });

  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      verified: true,
      promptpayId: '0812345678',
      promptpayName: 'ร้านพี่มีของแท้',
      reputationScore: 0.82,
      kycStatus: 'verified',
    },
  });

  const dealPendingId = ulid();
  await prisma.deal.create({
    data: {
      id: dealPendingId,
      title: 'เสื้อยืด Supreme แท้',
      amountSatang: 250000,
      currency: 'THB',
      sellerId: seller.id,
      status: DealStatus.PENDING,
      paylinkToken: randomBytes(8).toString('hex'),
      expiresAt: new Date(Date.now() + 86400000),
      buyerNote: 'ขอของแถมสติ๊กเกอร์',
    },
  });

  const dealHoldId = ulid();
  await prisma.deal.create({
    data: {
      id: dealHoldId,
      title: 'Nintendo Switch มือสอง',
      amountSatang: 850000,
      currency: 'THB',
      sellerId: seller.id,
      buyerId: buyer.id,
      status: DealStatus.HOLD,
      paylinkToken: randomBytes(8).toString('hex'),
      expiresAt: new Date(Date.now() + 86400000),
      payment: {
        create: {
          provider: 'mock_promptpay',
          providerRef: 'MOCK-' + randomBytes(4).toString('hex'),
          status: PaymentStatus.PAID,
          paidAt: new Date(),
        },
      },
    },
  });

  const dealDisputeId = ulid();
  await prisma.deal.create({
    data: {
      id: dealDisputeId,
      title: 'Louis Vuitton Speedy 25',
      amountSatang: 3900000,
      currency: 'THB',
      sellerId: seller.id,
      buyerId: buyer.id,
      status: DealStatus.DISPUTE,
      paylinkToken: randomBytes(8).toString('hex'),
      expiresAt: new Date(Date.now() + 86400000),
      trackingNumber: 'TH1234567890',
      courier: 'ThailandPost',
      deliveredAt: new Date(Date.now() - 72 * 3600 * 1000),
      autoReleaseAt: new Date(Date.now() - 24 * 3600 * 1000),
      payment: {
        create: {
          provider: 'mock_promptpay',
          providerRef: 'MOCK-' + randomBytes(4).toString('hex'),
          status: PaymentStatus.PAID,
          paidAt: new Date(Date.now() - 72 * 3600 * 1000),
        },
      },
      dispute: {
        create: {
          openedById: buyer.id,
          reasonText: 'ของไม่ตรงปก',
          status: DisputeStatus.OPEN,
          evidence: {
            create: [
              {
                uploadedById: buyer.id,
                kind: 'image',
                url: 'https://placehold.co/600x400?text=สินค้า',
                note: 'สีไม่ตรงตามประกาศ',
              },
              {
                uploadedById: buyer.id,
                kind: 'chatlog',
                url: 'https://placehold.co/600x400?text=แชท',
                note: 'แชทตกลงสีแดง',
              },
            ],
          },
        },
      },
    },
  });

  console.log('Seed data inserted', { admin: admin.email, seller: seller.email, buyer: buyer.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
