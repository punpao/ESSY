import { PrismaClient } from "@prisma/client";
import { ulid } from "ulid";

const prisma = new PrismaClient();

async function main() {
  await prisma.dealEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.reputationEvent.deleteMany();
  await prisma.sellerProfile.deleteMany();
  await prisma.emailOtp.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "ops@escrow.local",
      role: "admin",
      displayName: "Ops Admin",
      kycLevel: "basic"
    }
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@escrow.local",
      role: "seller",
      displayName: "แม่ค้าสายโอน",
      kycLevel: "basic"
    }
  });

  await prisma.sellerProfile.create({
    data: {
      userId: seller.id,
      verified: true,
      promptpayId: "0812345678",
      promptpayName: "แม่ค้าสายโอน",
      reputationScore: 0.85,
      kycStatus: "verified",
      selfieUrl: "https://picsum.photos/seed/seller/300/300"
    }
  });

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@escrow.local",
      role: "buyer",
      displayName: "นักช้อปสายชัวร์",
      kycLevel: "none"
    }
  });

  const pendingDealId = ulid();
  const holdDealId = ulid();
  const disputeDealId = ulid();

  await prisma.deal.create({
    data: {
      id: pendingDealId,
      title: "กระเป๋าแบรนด์แท้ สภาพดี",
      amountSatang: 1250000,
      currency: "THB",
      sellerId: seller.id,
      status: "PENDING",
      paylinkToken: "seedpaylinkpending",
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      buyerNote: "ขอของแท้ พร้อมใบเสร็จนะคะ"
    }
  });

  const holdDeal = await prisma.deal.create({
    data: {
      id: holdDealId,
      title: "iPhone 14 Pro 256GB",
      amountSatang: 2999000,
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "HOLD",
      paylinkToken: "seedpaylinkhold",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      trackingNumber: null,
      courier: null
    }
  });

  await prisma.payment.create({
    data: {
      dealId: holdDeal.id,
      provider: "mock_promptpay",
      providerRef: "seed-qr-hold",
      status: "PAID",
      amountSatang: holdDeal.amountSatang,
      paidAt: new Date()
    }
  });

  const disputeDeal = await prisma.deal.create({
    data: {
      id: disputeDealId,
      title: "รองเท้าสายแฟ",
      amountSatang: 890000,
      currency: "THB",
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "DISPUTE",
      paylinkToken: "seedpaylinkdispute",
      expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      trackingNumber: "TH123456789",
      courier: "Thailand Post",
      deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      autoReleaseAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  });

  await prisma.payment.create({
    data: {
      dealId: disputeDeal.id,
      provider: "mock_promptpay",
      providerRef: "seed-qr-dispute",
      status: "PAID",
      amountSatang: disputeDeal.amountSatang,
      paidAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
    }
  });

  const dispute = await prisma.dispute.create({
    data: {
      dealId: disputeDeal.id,
      openedById: buyer.id,
      reasonText: "ของไม่ตรงตามรูปที่ลงขาย",
      reasonCode: "ไม่ตรงปก",
      status: "OPEN"
    }
  });

  await prisma.evidence.createMany({
    data: [
      {
        disputeId: dispute.id,
        uploadedById: buyer.id,
        kind: "image",
        url: "https://picsum.photos/seed/evidence1/400/400",
        note: "รูปสินค้าที่ได้รับ"
      },
      {
        disputeId: dispute.id,
        uploadedById: buyer.id,
        kind: "chatlog",
        url: "https://example.com/chatlog",
        note: "แชทคุยกับผู้ขาย"
      }
    ]
  });

  await prisma.dealEvent.createMany({
    data: [
      {
        dealId: pendingDealId,
        status: "PENDING",
        actorId: seller.id,
        note: "สร้างเพย์ลิงก์",
        createdAt: new Date()
      },
      {
        dealId: holdDeal.id,
        status: "HOLD",
        actorId: buyer.id,
        note: "ชำระเงินสำเร็จ",
        createdAt: new Date()
      },
      {
        dealId: disputeDeal.id,
        status: "DISPUTE",
        actorId: buyer.id,
        note: "แจ้งข้อพิพาท",
        createdAt: new Date()
      }
    ]
  });

  console.log("Seed data created:", {
    admin: admin.email,
    seller: seller.email,
    buyer: buyer.email
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
