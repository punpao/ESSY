import { Queue, QueueScheduler, Worker } from 'bullmq'
import IORedis from 'ioredis'
import type { PrismaClient } from '@prisma/client'
import { evaluateSellerReputation } from '@escrow/core'

import { env } from '../env'
import { applyEscrowTransition } from '../services/dealService'

const connection = new IORedis(env.REDIS_URL, {
  maxRetriesPerRequest: null
})

const queueName = 'deal-control'

export const dealQueue = new Queue(queueName, {
  connection
})

const scheduler = new QueueScheduler(queueName, {
  connection
})

export const enqueueReputationRecalc = async (sellerProfileId: string) => {
  await dealQueue.add(
    'reputation-recalc',
    { sellerProfileId },
    { jobId: `reputation-${sellerProfileId}`, delay: 1000 }
  )
}

const processAutoRelease = async (prisma: PrismaClient) => {
  const now = new Date()
  const candidates = await prisma.deal.findMany({
    where: {
      status: 'SHIPPED',
      autoReleaseAt: {
        lte: now
      },
      OR: [
        {
          dispute: null
        },
        {
          dispute: {
            status: {
              notIn: ['OPEN', 'NEED_MORE_INFO']
            }
          }
        }
      ]
    },
    include: {
      payments: true,
      seller: {
        select: {
          id: true,
          sellerProfile: true
        }
      }
    }
  })

  for (const deal of candidates) {
    await applyEscrowTransition(prisma, deal.id, {
      event: { type: 'AUTO_RELEASE' },
      metadata: { reason: 'Auto release after delivery window' }
    })

    await prisma.payment.updateMany({
      where: { dealId: deal.id, status: 'PAID' },
      data: { status: 'PAID' }
    })

    if (deal.seller.sellerProfile) {
      await enqueueReputationRecalc(deal.seller.sellerProfile.id)
    }
  }
}

const processReputation = async (
  prisma: PrismaClient,
  sellerProfileId: string
) => {
  const stats = await prisma.deal.groupBy({
    by: ['status'],
    where: {
      seller: {
        sellerProfile: {
          id: sellerProfileId
        }
      }
    },
    _count: true
  })

  const releasedCount =
    stats.find((item) => item.status === 'RELEASED')?._count ?? 0
  const disputeCount =
    stats.find((item) => item.status === 'DISPUTE')?._count ?? 0

  const reputation = evaluateSellerReputation({
    releasedCount,
    disputeCount
  })

  await prisma.sellerProfile.update({
    where: { id: sellerProfileId },
    data: { reputationScore: reputation.score }
  })
}

export const initJobRunner = (prisma: PrismaClient) => {
  const worker = new Worker(
    queueName,
    async (job) => {
      if (job.name === 'auto-release') {
        await processAutoRelease(prisma)
      }
      if (job.name === 'reputation-recalc') {
        await processReputation(prisma, job.data.sellerProfileId)
      }
    },
    { connection }
  )

  worker.on('failed', (job, error) => {
    console.error('Job failed', job?.name, error)
  })

  const start = async () => {
    await scheduler.waitUntilReady()
    await dealQueue.add(
      'auto-release',
      {},
      {
        jobId: 'auto-release',
        repeat: {
          every: 15 * 60 * 1000
        }
      }
    )
  }

  void start()

  return {
    async close() {
      await worker.close()
      await dealQueue.close()
      await scheduler.close()
      await connection.quit()
    }
  }
}
