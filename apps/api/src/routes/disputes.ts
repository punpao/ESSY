import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppConfig } from '../config.js';
import { applyDealTransition } from '../services/dealState.js';

const openSchema = z.object({
  reason: z.string().min(5)
});

const evidenceSchema = z.object({
  items: z
    .array(
      z.object({
        kind: z.enum(['image', 'chatlog', 'other']),
        url: z.string().url(),
        note: z.string().max(500).optional()
      })
    )
    .min(1)
});

const resolveSchema = z.object({
  resolution: z.enum(['REFUND', 'RELEASE']),
  note: z.string().min(3)
});

export const disputeRoutes = async (fastify: FastifyInstance, _config: AppConfig) => {
  fastify.post(
    '/api/v1/disputes/:dealId/open',
    { preHandler: [fastify.authenticate, fastify.authorize(['buyer'])] },
    async (request, reply) => {
      const dealId = z.string().parse((request.params as any).dealId);
      const { reason } = openSchema.parse(request.body);

      const deal = await fastify.prisma.deal.findFirst({
        where: { id: dealId, buyerId: request.user.id },
        include: { dispute: true }
      });
      if (!deal) {
        return reply.code(404).send({ message: 'ไม่พบดีลของคุณ' });
      }
      if (!['HOLD', 'SHIPPED'].includes(deal.status)) {
        return reply.code(400).send({ message: 'เปิดข้อพิพาทได้หลังชำระเงิน' });
      }
      if (deal.dispute) {
        return reply.code(400).send({ message: 'ดีลนี้เปิดข้อพิพาทแล้ว' });
      }

      await fastify.prisma.$transaction(async (tx) => {
        await tx.dispute.create({
          data: {
            dealId,
            openedById: request.user.id,
            reasonText: reason
          }
        });

        await applyDealTransition(
          tx as any,
          { ...deal, dispute: { status: 'OPEN' } },
          { type: 'DISPUTE_OPEN' },
          request.user.id
        );
      });

      await fastify.prisma.dealEvent.create({
        data: {
          dealId,
          actorId: request.user.id,
          event: 'DISPUTE_OPEN',
          note: `ผู้ซื้อเปิดข้อพิพาท: ${reason}`
        }
      });

      return reply.send({ message: 'เปิดข้อพิพาทแล้ว ทีมงานจะติดต่อกลับภายใน 24 ชม.' });
    }
  );

  fastify.post(
    '/api/v1/disputes/:id/evidence',
    { preHandler: [fastify.authenticate, fastify.authorize(['buyer', 'seller', 'admin'])] },
    async (request, reply) => {
      const disputeId = z.string().parse((request.params as any).id);
      const { items } = evidenceSchema.parse(request.body);

      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { deal: true }
      });
      if (!dispute) {
        return reply.code(404).send({ message: 'ไม่พบข้อพิพาท' });
      }
      if (![dispute.openedById, dispute.deal.sellerId].includes(request.user.id) && request.user.role !== 'admin') {
        return reply.code(403).send({ message: 'คุณไม่มีสิทธิ์อัปโหลดหลักฐาน' });
      }

      await fastify.prisma.$transaction(
        items.map((item) =>
          fastify.prisma.evidence.create({
            data: {
              disputeId,
              uploadedBy: request.user.id,
              kind: item.kind,
              url: item.url,
              note: item.note ?? null
            }
          })
        )
      );

      return reply.send({ message: 'อัปโหลดหลักฐานแล้ว' });
    }
  );

  fastify.post(
    '/api/v1/disputes/:id/resolve',
    { preHandler: [fastify.authenticate, fastify.authorize(['admin'])] },
    async (request, reply) => {
      const disputeId = z.string().parse((request.params as any).id);
      const { resolution, note } = resolveSchema.parse(request.body);

      const dispute = await fastify.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: { deal: { include: { payment: true, dispute: true } } }
      });
      if (!dispute) {
        return reply.code(404).send({ message: 'ไม่พบข้อพิพาท' });
      }

      const deal = dispute.deal;

      await fastify.prisma.$transaction(async (tx) => {
        const sellerProfile = await tx.sellerProfile.findUnique({
          where: { userId: deal.sellerId }
        });

        if (resolution === 'REFUND') {
          if (!deal.payment) {
            throw new Error('ไม่มีการชำระเงินสำหรับดีลนี้');
          }
          await tx.payment.update({
            where: { id: deal.payment.id },
            data: { status: 'REFUNDED' }
          });

          await applyDealTransition(
            tx as any,
            { ...deal, dispute: { status: 'OPEN' } },
            { type: 'ADMIN_REFUND' },
            request.user.id,
            { autoReleaseAt: null }
          );

          if (sellerProfile) {
            await tx.reputationEvent.create({
              data: {
                sellerId: sellerProfile.id,
                type: 'negative',
                weight: -1,
                note: `ข้อพิพาทตัดสินคืนเงิน: ${note}`
              }
            });
          }
        } else {
          await applyDealTransition(
            tx as any,
            { ...deal, dispute: { status: 'OPEN' } },
            { type: 'ADMIN_RELEASE' },
            request.user.id,
            { autoReleaseAt: null }
          );

          if (sellerProfile) {
            await tx.reputationEvent.create({
              data: {
                sellerId: sellerProfile.id,
                type: 'positive',
                weight: 1,
                note: `ข้อพิพาทตัดสินโอนให้ผู้ขาย: ${note}`
              }
            });
          }
        }

        await tx.dispute.update({
          where: { id: dispute.id },
          data: {
            status: resolution === 'REFUND' ? 'RESOLVED_REFUND' : 'RESOLVED_RELEASE',
            resolutionNote: note,
            resolvedAt: new Date()
          }
        });
      });

      await fastify.queues.reputation.add('recalculate', { sellerId: deal.sellerId });

      await fastify.prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          actorId: request.user.id,
          event: `DISPUTE_${resolution}`,
          note
        }
      });

      return reply.send({ message: 'ปิดข้อพิพาทเรียบร้อย' });
    }
  );
};
