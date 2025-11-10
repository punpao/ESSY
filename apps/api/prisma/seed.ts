import { PrismaClient, DisputeStatus, DealStatus } from '@prisma/client';
import { ulid } from 'ulid';
import { generatePaylinkToken } from '../src/utils/id.js';
import {
  SEED_ADMIN_ID,
  SEED_SELLER_ID,
  SEED_BUYER_ID,
  SEED_SELLER_PROFILE_ID
} from './seed-ids.js';

const prisma = new PrismaClient();

const createDeal = async (
  params: {
    id?: string;
    title: string;
    amountSatang: number;
    status: DealStatus;
    sellerId: string;
    buyerId?: string;
    paylinkToken?: string;
    trackingNumber?: string | null;
    courier?: string | null;
    deliveredAt?: Date | null;
    autoReleaseAt?: Date | null;
  },
  includePayment = false
) => {
  const deal = await prisma.deal.create({
    data: {
      id: params.id ?? ulid(),
      title: params.title,
      amountSatang: params.amountSatang,
      sellerId: params.sellerId,
      buyerId: params.buyerId ?? null,
      status: params.status,
      paylinkToken: params.paylinkToken ?? generatePaylinkToken(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      trackingNumber: params.trackingNumber ?? null,
      courier: params.courier ?? null,
      deliveredAt: params.deliveredAt ?? null,
      autoReleaseAt: params.autoReleaseAt ?? null
    }
  });

  await prisma.dealEvent.create({
    data: {
      dealId: deal.id,
      actorId: params.sellerId,
      event: 'SEED_CREATE',
      note: 'Seed data initial deal'
    }
  });

  if (includePayment) {
    await prisma.payment.upsert({
      where: { dealId: deal.id },
      update: {
        status: params.status === 'REFUND' ? 'REFUNDED' : 'PAID',
        paidAt: new Date()
      },
      create: {
        dealId: deal.id,
        provider: 'mock_promptpay',
        providerRef: `seed-${deal.id}`,
        status: params.status === 'REFUND' ? 'REFUNDED' : 'PAID',
        paidAt: new Date()
      }
    });
  }

  return deal;
};

async function main() {
  console.log('🌱 Seeding database...');
  await prisma.reputationEvent.deleteMany({});
  await prisma.evidence.deleteMany({});
  await prisma.dispute.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.dealEvent.deleteMany({});
  await prisma.deal.deleteMany({});
  await prisma.sellerProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const admin = await prisma.user.create({
    data: {
      id: SEED_ADMIN_ID,
      email: 'admin@socialtrust.th',
      displayName: 'SocialTrust Ops',
      role: 'admin',
      kycLevel: 'FULL'
    }
  });

  const seller = await prisma.user.create({
    data: {
      id: SEED_SELLER_ID,
      email: 'seller@socialtrust.th',
      displayName: 'แม่ค้ามือโปร',
      role: 'seller',
      kycLevel: 'FULL'
    }
  });

  const sellerProfile = await prisma.sellerProfile.create({
    data: {
      id: SEED_SELLER_PROFILE_ID,
      userId: seller.id,
      verified: true,
      promptpayId: '0812345678',
      promptpayName: 'นางสาวแม่ค้าใจดี',
      kycSelfieUrl: 'https://example.com/selfie.jpg',
      promptpayProofUrl: 'https://example.com/promptpay.jpg',
      kycStatus: 'VERIFIED',
      reputationScore: 0.8
    }
  });

  const buyer = await prisma.user.create({
    data: {
      id: SEED_BUYER_ID,
      email: 'buyer@socialtrust.th',
      displayName: 'คนซื้อพร้อมโอน',
      role: 'buyer',
      kycLevel: 'BASIC'
    }
  });

  const pendingDeal = await createDeal({
    title: 'กระเป๋าแบรนด์มือสอง',
    amountSatang: 350000,
    status: 'PENDING',
    sellerId: seller.id,
    paylinkToken: 'SEEDPEND1'
  });

  const holdDeal = await createDeal(
    {
      title: 'หูฟัง AirPods Pro',
      amountSatang: 790000,
      status: 'HOLD',
      sellerId: seller.id,
      buyerId: buyer.id,
      trackingNumber: 'TH123456789',
      courier: 'Thailand Post'
    },
    true
  );

  const disputeDeal = await createDeal(
    {
      title: 'Nintendo Switch มือสอง',
      amountSatang: 890000,
      status: 'DISPUTE',
      sellerId: seller.id,
      buyerId: buyer.id,
      trackingNumber: 'SCG987654321',
      courier: 'SCG Express',
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      autoReleaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    },
    true
  );

  const dispute = await prisma.dispute.create({
    data: {
      dealId: disputeDeal.id,
      openedById: buyer.id,
      reasonText: 'ของที่ได้รับมีรอยขีดข่วน',
      status: DisputeStatus.OPEN
    }
  });

  await prisma.evidence.createMany({
    data: [
      {
        disputeId: dispute.id,
        uploadedBy: buyer.id,
        kind: 'image',
        url: 'https://example.com/evidence/scuff.jpg',
        note: 'ภาพรอยขีดข่วน'
      },
      {
        disputeId: dispute.id,
        uploadedBy: buyer.id,
        kind: 'chatlog',
        url: 'https://example.com/evidence/chat.png',
        note: 'แชทคุยกับผู้ขาย'
      }
    ]
  });

  await prisma.reputationEvent.create({
    data: {
      sellerId: sellerProfile.id,
      type: 'positive',
      weight: 1,
      note: 'ดีลสำเร็จพร้อมรีวิว 5 ดาว'
    }
  });

  await prisma.dealEvent.createMany({
    data: [
      {
        dealId: holdDeal.id,
        actorId: seller.id,
        event: 'PAYMENT_PAID',
        note: 'ผู้ซื้อชำระเงินแล้ว'
      },
      {
        dealId: disputeDeal.id,
        actorId: buyer.id,
        event: 'DISPUTE_OPEN',
        note: 'ผู้ซื้อเปิดข้อพิพาทจากการ seed'
      }
    ]
  });

  console.log('✅ Seed data created');
  console.log({ admin, seller, buyer, pendingDeal, holdDeal, disputeDeal });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
