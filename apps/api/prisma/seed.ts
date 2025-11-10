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
      email: "ops@escrow.th",
      displayName: "ทีมงาน Escrow",
      role: "admin"
    }
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@escrow.th",
      displayName: "น้องเมย์ ของแท้",
      role: "seller",
      kycLevel: "full",
      sellerProfile: {
        create: {
          promptPayId: "0812345678",
          promptPayName: "เมษา สงวนดี",
          verified: true,
          kycStatus: "verified",
          reputationScore: 4.6,
          kycSelfieUrl: "https://placehold.co/400x400?text=selfie",
          kycSubmittedAt: new Date()
        }
      }
    },
    include: {
      sellerProfile: true
    }
  });

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@escrow.th",
      displayName: "คุณโอม",
      role: "buyer"
    }
  });

  const dealHold = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "iPhone 13 มือสอง สภาพสวย",
      amountSatang: 1899000,
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "HOLD",
      paylinkToken: "seed-hold",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      autoReleaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      payment: {
        create: {
          provider: "mock_promptpay",
          providerRef: "mock-hold-qr",
          status: "PAID",
          paidAt: new Date()
        }
      },
      events: {
        create: [
          {
            type: "deal.created",
            actorId: seller.id
          },
          {
            type: "payment.held",
            actorId: buyer.id
          }
        ]
      }
    }
  });

  const dealShipped = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "รองเท้า Nike Dunk Panda",
      amountSatang: 450000,
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "SHIPPED",
      paylinkToken: "seed-ship",
      trackingNumber: "TH1234567890",
      courier: "Thailand Post",
      deliveredAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      autoReleaseAt: new Date(Date.now() + 36 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      payment: {
        create: {
          provider: "mock_promptpay",
          providerRef: "mock-ship-qr",
          status: "PAID",
          paidAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      events: {
        create: [
          {
            type: "deal.created",
            actorId: seller.id
          },
          {
            type: "payment.held",
            actorId: buyer.id
          },
          {
            type: "deal.shipped",
            actorId: seller.id,
            payload: {
              courier: "Thailand Post",
              trackingNumber: "TH1234567890"
            }
          }
        ]
      }
    }
  });

  const dealDispute = await prisma.deal.create({
    data: {
      id: ulid(),
      title: "กระเป๋าแบรนด์เนมมือสอง",
      amountSatang: 799000,
      sellerId: seller.id,
      buyerId: buyer.id,
      status: "DISPUTE",
      paylinkToken: "seed-dispute",
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      payment: {
        create: {
          provider: "mock_promptpay",
          providerRef: "mock-dispute-qr",
          status: "PAID",
          paidAt: new Date(Date.now() - 48 * 60 * 60 * 1000)
        }
      },
      dispute: {
        create: {
          openedById: buyer.id,
          reasonText: "ของไม่ตรงปก: สีไม่ตรงกับรูปในโพสต์",
          evidence: {
            create: [
              {
                uploadedById: buyer.id,
                kind: "image",
                url: "https://placehold.co/600x400?text=หลักฐาน1",
                note: "รูปที่ผู้ขายส่งให้ในแชท"
              },
              {
                uploadedById: buyer.id,
                kind: "chatlog",
                url: "https://placehold.co/600x400?text=แชท",
                note: "แคปหน้าจอแชท"
              }
            ]
          }
        }
      },
      events: {
        create: [
          {
            type: "deal.created",
            actorId: seller.id
          },
          {
            type: "payment.held",
            actorId: buyer.id
          },
          {
            type: "dispute.opened",
            actorId: buyer.id,
            payload: {
              reason: "ของไม่ตรงปก",
              note: "สีไม่ตรงกับภาพ"
            }
          }
        ]
      }
    },
    include: {
      dispute: true
    }
  });

  await prisma.reputationEvent.createMany({
    data: [
      {
        sellerId: seller.sellerProfile!.id,
        type: "positive",
        weight: 1,
        note: "ดีลออกของเรียบร้อย"
      },
      {
        sellerId: seller.sellerProfile!.id,
        type: "negative",
        weight: -1,
        note: "มีข้อพิพาทค้างอยู่"
      }
    ]
  });

  console.log("Seed data created:", {
    admin: admin.email,
    seller: seller.email,
    buyer: buyer.email,
    deals: [dealHold.id, dealShipped.id, dealDispute.id]
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
