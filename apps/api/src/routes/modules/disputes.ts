import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { transitionDeal } from '../../services/dealService';
import { getPaymentProvider } from '../../lib/payment';

const openSchema = z.object({
  reason: z.enum(['ของยังไม่ถึง', 'ของไม่ตรงปก', 'อื่น ๆ']),
  detail: z.string().optional()
});

const evidenceSchema = z.object({
  evidence: z
    .array(
      z.object({
        kind: z.enum(['image', 'chatlog', 'other']),
        url: z.string().url(),
        note: z.string().optional()
      })
    )
    .min(1)
});

const resolveSchema = z.object({
  decision: z.enum(['RESOLVED_REFUND', 'RESOLVED_RELEASE']),
  note: z.string().optional()
});

export async function disputeRoutes(app: FastifyInstance) {
  app.get(
    '/:id',
    { preHandler: app.authorize(['buyer', 'seller', 'admin']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: true,
          evidence: true,
          openedBy: true
        }
      });
      if (!dispute) return reply.notFound();
      if (
        request.user.role !== 'admin' &&
        ![dispute.openedById, dispute.deal.sellerId, dispute.deal.buyerId ?? ''].includes(request.user.id)
      ) {
        return reply.forbidden();
      }
      return reply.send({ dispute });
    }
  );

  app.post(
    '/:dealId/open',
    { preHandler: app.authorize(['buyer']) },
    async (request, reply) => {
      const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
      const body = openSchema.parse(request.body);

      const deal = await prisma.deal.findUnique({
        where: { id: dealId }
      });
      if (!deal) return reply.notFound();
      if (deal.buyerId !== request.user.id) return reply.forbidden();
      if (!['HOLD', 'SHIPPED'].includes(deal.status)) {
        return reply.status(400).send({ error: 'เปิดข้อพิพาทได้เฉพาะคำสั่งซื้อที่ชำระแล้ว' });
      }
      const existingDispute = await prisma.dispute.findUnique({ where: { dealId } });
      if (existingDispute) {
        return reply.status(400).send({ error: 'มีข้อพิพาทอยู่แล้ว' });
      }

      const dispute = await prisma.dispute.create({
        data: {
          dealId,
          openedById: request.user.id,
          reasonText: `${body.reason}${body.detail ? ` - ${body.detail}` : ''}`,
          status: 'OPEN'
        }
      });
      await transitionDeal({
        dealId,
        event: { type: 'OPEN_DISPUTE' },
        context: { actorId: request.user.id, actorRole: 'buyer', note: body.reason }
      });
      return reply.send({ dispute });
    }
  );

  app.post(
    '/:id/evidence',
    { preHandler: app.authorize(['buyer', 'admin']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = evidenceSchema.parse(request.body);
      const dispute = await prisma.dispute.findUnique({ where: { id } });
      if (!dispute) return reply.notFound();
      if (dispute.openedById !== request.user.id && request.user.role !== 'admin') {
        return reply.forbidden();
      }

      await prisma.evidence.createMany({
        data: body.evidence.map((item) => ({
          disputeId: id,
          uploadedById: request.user.id,
          kind: item.kind,
          url: item.url,
          note: item.note
        }))
      });
      return reply.send({ ok: true });
    }
  );

  app.post(
    '/:id/resolve',
    { preHandler: app.authorize(['admin']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = resolveSchema.parse(request.body);
      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: { deal: { include: { payments: true } } }
      });
      if (!dispute) return reply.notFound();

      let dealStatusEvent: Parameters<typeof transitionDeal>[0]['event'] = { type: 'ADMIN_RESOLVE_RELEASE' };

      if (body.decision === 'RESOLVED_REFUND') {
        const payment = dispute.deal.payments.find((p) => p.status === 'PAID');
        if (payment) {
          const provider = getPaymentProvider(payment.provider);
          await provider.refund(payment.providerRef, dispute.deal.amountSatang);
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'REFUNDED' }
          });
        }
        dealStatusEvent = { type: 'ADMIN_RESOLVE_REFUND' };
      }

      const updatedDeal = await transitionDeal({
        dealId: dispute.dealId,
        event: dealStatusEvent,
        context: { actorId: request.user.id, actorRole: 'admin', note: body.note }
      });

      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: {
          status: body.decision,
          resolutionNote: body.note,
          resolvedAt: new Date()
        }
      });

      return reply.send({ dispute: updatedDispute, deal: updatedDeal });
    }
  );
}
