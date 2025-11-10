import { PrismaClient, DealStatus, DisputeStatus } from '@prisma/client'
import { ulid } from 'ulid'

const prisma = new PrismaClient()

const AUTO_RELEASE_HOURS = parseInt(process.env.AUTO_RELEASE_HOURS ?? '48', 10)

const addHours = (date: Date, hours: number) => {
  const result = new Date(date)
  result.setHours(result.getHours() + hours)
  return result
}

async function main() {
  console.info('🌱 Seeding database...')

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@escrow.local' },
    update: {},
    create: {
      id: ulid(),
      role: 'buyer',
      email: 'buyer@escrow.local',
      displayName: 'คุณผู้ซื้อ',
      kycLevel: 'basic'
    }
  })

  const seller = await prisma.user.upsert({
    where: { email: 'seller@escrow.local' },
    update: {},
    create: {
      id: ulid(),
      role: 'seller',
      email: 'seller@escrow.local',
      displayName: 'ร้านพี่พลอย',
      kycLevel: 'full'
    }
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@escrow.local' },
    update: {},
    create: {
      id: ulid(),
      role: 'admin',
      email: 'admin@escrow.local',
      displayName: 'ทีมออปส์',
      kycLevel: 'full'
    }
  })

  const sellerProfile = await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {
      verified: true,
      kycStatus: 'verified',
      promptpayId: '0812345678',
      promptpayName: 'ร้านพี่พลอย',
      reputationScore: 0.82
    },
    create: {
      id: ulid(),
      userId: seller.id,
      verified: true,
      kycStatus: 'verified',
      promptpayId: '0812345678',
      promptpayName: 'ร้านพี่พลอย',
      reputationScore: 0.82
    }
  })

  const now = new Date()

  const releasedDealId = ulid()
  const holdDealId = ulid()
  const disputeDealId = ulid()

  const disputeDeliveredAt = addHours(now, -12)

  await prisma.deal.create({
    data: {
      id: releasedDealId,
      title: 'Nike Dunk Low Panda มือสอง',
      amountSatang: 450000,
      sellerId: seller.id,
      buyerId: buyer.id,
      status: DealStatus.RELEASED,
      paylinkToken: 'demo-release',
      expiresAt: addHours(now, 24),
      buyerNote: 'ขอเช็คของก่อนจ่ายปล่อย',
      trackingNumber: 'TH1234567890',
      courier: 'ThaiPost',
      deliveredAt: addHours(now, -72),
      autoReleaseAt: addHours(now, -24),
      payments: {
        create: {
          id: ulid(),
          provider: 'mock_promptpay',
          providerRef: 'mockpp_release',
          status: 'PAID',
          paidAt: addHours(now, -80)
        }
      },
      events: {
        createMany: {
          data: [
            {
              id: ulid(),
              fromStatus: DealStatus.PENDING,
              toStatus: DealStatus.HOLD,
              actorId: buyer.id,
              metadata: { note: 'Buyer paid via PromptPay' }
            },
            {
              id: ulid(),
              fromStatus: DealStatus.HOLD,
              toStatus: DealStatus.SHIPPED,
              actorId: seller.id,
              metadata: { trackingNumber: 'TH1234567890' }
            },
            {
              id: ulid(),
              fromStatus: DealStatus.SHIPPED,
              toStatus: DealStatus.RELEASED,
              actorId: buyer.id,
              metadata: { action: 'Buyer confirmed' }
            }
          ]
        }
      }
    }
  })

  await prisma.deal.create({
    data: {
      id: holdDealId,
      title: 'iPad Mini 6 64GB',
      amountSatang: 1150000,
      sellerId: seller.id,
      buyerId: buyer.id,
      status: DealStatus.HOLD,
      paylinkToken: 'demo-hold',
      expiresAt: addHours(now, 12),
      buyerNote: 'ขอแพ็คกันกระแทกเพิ่มค่ะ',
      payments: {
        create: {
          id: ulid(),
          provider: 'mock_promptpay',
          providerRef: 'mockpp_hold',
          status: 'PAID',
          paidAt: addHours(now, -2)
        }
      },
      events: {
        create: {
          id: ulid(),
          fromStatus: DealStatus.PENDING,
          toStatus: DealStatus.HOLD,
          actorId: buyer.id,
          metadata: { note: 'Buyer paid' }
        }
      }
    }
  })

  await prisma.deal.create({
    data: {
      id: disputeDealId,
      title: 'เสื้อ Supreme แท้',
      amountSatang: 650000,
      sellerId: seller.id,
      buyerId: buyer.id,
      status: DealStatus.DISPUTE,
      paylinkToken: 'demo-dispute',
      expiresAt: addHours(now, 48),
      buyerNote: 'ขอให้ส่ง EMS',
      trackingNumber: 'FLASH987654321',
      courier: 'Flash Express',
      deliveredAt: disputeDeliveredAt,
      autoReleaseAt: addHours(disputeDeliveredAt, AUTO_RELEASE_HOURS),
      payments: {
        create: {
          id: ulid(),
          provider: 'mock_promptpay',
          providerRef: 'mockpp_dispute',
          status: 'PAID',
          paidAt: addHours(now, -24)
        }
      },
      dispute: {
        create: {
          id: ulid(),
          openedById: buyer.id,
          reasonText: 'ของไม่ตรงปก',
          status: DisputeStatus.OPEN,
          evidences: {
            createMany: {
              data: [
                {
                  id: ulid(),
                  uploadedById: buyer.id,
                  kind: 'image',
                  url: 'https://placehold.co/600x400?text=สินค้าไม่ตรง',
                  note: 'สีซีดกว่ารูป'
                },
                {
                  id: ulid(),
                  uploadedById: buyer.id,
                  kind: 'chatlog',
                  url: 'https://placehold.co/400x600?text=แชท+ผู้ขาย',
                  note: 'ตกลงกันว่าจะเป็นของแท้'
                }
              ]
            }
          }
        }
      },
      events: {
        createMany: {
          data: [
            {
              id: ulid(),
              fromStatus: DealStatus.PENDING,
              toStatus: DealStatus.HOLD,
              actorId: buyer.id,
              metadata: { note: 'Buyer paid' }
            },
            {
              id: ulid(),
              fromStatus: DealStatus.HOLD,
              toStatus: DealStatus.SHIPPED,
              actorId: seller.id,
              metadata: { trackingNumber: 'FLASH987654321' }
            },
            {
              id: ulid(),
              fromStatus: DealStatus.SHIPPED,
              toStatus: DealStatus.DISPUTE,
              actorId: buyer.id,
              metadata: { reason: 'สินค้าไม่ตรงปก' }
            }
          ]
        }
      }
    }
  })

  await prisma.reputationEvent.createMany({
    data: [
      {
        id: ulid(),
        sellerId: sellerProfile.id,
        type: 'positive',
        weight: 0.5,
        note: 'เวลาจัดส่งเร็ว'
      },
      {
        id: ulid(),
        sellerId: sellerProfile.id,
        type: 'neutral',
        weight: -0.1,
        note: 'มีข้อพิพาท 1 เคส'
      }
    ],
    skipDuplicates: true
  })

  console.info('✅ Seed data inserted')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
