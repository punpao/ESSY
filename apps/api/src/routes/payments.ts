import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppConfig } from '../config.js';
import { applyDealTransition } from '../services/dealState.js';

const createPaymentSchema = z.object({
  paylinkToken: z.string().length(10),
  payerEmail: z.string().email().optional()
});

const webhookSchema = z.object({
  dealId: z.string(),
  providerRef: z.string(),
  payerEmail: z.string().email().optional()
});

export const paymentRoutes = async (fastify: FastifyInstance, _config: AppConfig) => {
  fastify.post('/api/v1/payments/create', async (request, reply) => {
    const { paylinkToken, payerEmail } = createPaymentSchema.parse(request.body);

    const deal = await fastify.prisma.deal.findUnique({
      where: { paylinkToken },
      include: { payment: true }
    });

    if (!deal) {
      return reply.code(404).send({ message: 'ไม่พบเพย์ลิงก์' });
    }

    if (deal.status !== 'PENDING') {
      return reply.code(400).send({ message: 'เพย์ลิงก์นี้ไม่พร้อมชำระแล้ว' });
    }

    if (deal.expiresAt < new Date()) {
      return reply.code(400).send({ message: 'เพย์ลิงก์หมดอายุแล้ว' });
    }

    const charge = await fastify.paymentProvider.createCharge({
      id: deal.id,
      amountSatang: deal.amountSatang,
      currency: deal.currency
    });

    await fastify.prisma.payment.upsert({
      where: { dealId: deal.id },
      update: {
        providerRef: charge.providerRef,
        status: 'INIT'
      },
      create: {
        dealId: deal.id,
        provider: 'mock_promptpay',
        providerRef: charge.providerRef,
        status: 'INIT'
      }
    });

    await fastify.prisma.dealEvent.create({
      data: {
        dealId: deal.id,
        actorId: null,
        event: 'PAYMENT_INIT',
        note: payerEmail ? `ผู้ซื้อ (${payerEmail}) ขอ QR PromptPay` : 'ผู้ซื้อขอ QR PromptPay'
      }
    });

    return reply.send({
      qrString: charge.qrString,
      providerRef: charge.providerRef,
      amountSatang: deal.amountSatang,
      message: 'สแกน QR ผ่านแอปธนาคารหรือ PromptPay แล้วอัปโหลดสลิป'
    });
  });

  fastify.post('/api/v1/payments/webhook/mock', async (request, reply) => {
    const payload = webhookSchema.parse(request.body);
    const verified = fastify.paymentProvider.verifyWebhook(payload, request.headers);
    if (!verified) {
      return reply.code(401).send({ message: 'ลายเซ็นไม่ถูกต้อง' });
    }

    const payment = await fastify.prisma.payment.findUnique({
      where: { providerRef: payload.providerRef }
    });
    if (!payment) {
      return reply.code(404).send({ message: 'ไม่พบการชำระเงิน' });
    }

    const deal = await fastify.prisma.deal.findUnique({
      where: { id: payment.dealId },
      include: { dispute: true }
    });
    if (!deal) {
      return reply.code(404).send({ message: 'ไม่พบดีล' });
    }

    if (deal.status !== 'PENDING') {
      return reply.code(409).send({ message: 'ดีลนี้ถูกชำระไปแล้ว' });
    }

    let buyerId = deal.buyerId;

    if (!buyerId && payload.payerEmail) {
      const buyer = await fastify.prisma.user.upsert({
        where: { email: payload.payerEmail },
        update: {},
        create: {
          email: payload.payerEmail,
          displayName: payload.payerEmail.split('@')[0],
          role: 'buyer'
        }
      });
      buyerId = buyer.id;
    }

    await fastify.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });

      const dealForTransition = await tx.deal.findUnique({
        where: { id: deal.id },
        include: { dispute: true }
      });
      if (!dealForTransition) return;

      await applyDealTransition(tx, dealForTransition, { type: 'PAYMENT_PAID' }, buyerId ?? null, {
        buyerId: buyerId ?? dealForTransition.buyerId
      });
    });

    await fastify.prisma.dealEvent.create({
      data: {
        dealId: deal.id,
        actorId: buyerId,
        event: 'PAYMENT_PAID',
        note: 'ระบบพักเงินไว้แล้ว กำลังแจ้งผู้ขายจัดส่ง'
      }
    });

    return reply.send({ message: 'บันทึกการชำระเงินแล้ว เงินถูกพักไว้ (HOLD)' });
  });

  const refundSchema = z.object({
    reason: z.string().min(3)
  });

  fastify.post(
    '/api/v1/payments/:dealId/refund',
    { preHandler: [fastify.authenticate, fastify.authorize(['admin'])] },
    async (request, reply) => {
      const dealId = z.string().parse((request.params as any).dealId);
      const { reason } = refundSchema.parse(request.body);

      const deal = await fastify.prisma.deal.findUnique({
        where: { id: dealId },
        include: { payment: true, dispute: true }
      });
      if (!deal || !deal.payment) {
        return reply.code(404).send({ message: 'ไม่พบดีลหรือการชำระเงิน' });
      }

      await fastify.paymentProvider.refund({
        id: deal.payment.id,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        providerRef: deal.payment.providerRef
      });

      await fastify.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: deal.payment!.id },
          data: {
            status: 'REFUNDED'
          }
        });

        const dealWithDispute = await tx.deal.findUnique({
          where: { id: deal.id },
          include: { dispute: true }
        });
        if (!dealWithDispute) return;

        await applyDealTransition(tx, dealWithDispute, { type: 'ADMIN_REFUND' }, request.user.id, {
          autoReleaseAt: null
        });

        if (dealWithDispute.dispute) {
          await tx.dispute.update({
            where: { id: dealWithDispute.dispute.id },
            data: {
              status: 'RESOLVED_REFUND',
              resolutionNote: reason,
              resolvedAt: new Date()
            }
          });
        }
      });

      const sellerProfile = await fastify.prisma.sellerProfile.findUnique({
        where: { userId: deal.sellerId }
      });
      if (sellerProfile) {
        await fastify.prisma.reputationEvent.create({
          data: {
            sellerId: sellerProfile.id,
            type: 'negative',
            weight: -1,
            note: `คืนเงินจากแอดมิน: ${reason}`
          }
        });
      } else {
        fastify.log.warn('ไม่พบโปรไฟล์ผู้ขายสำหรับบันทึกคะแนนความน่าเชื่อถือ');
      }

      await fastify.queues.reputation.add('recalculate', { sellerId: deal.sellerId });

      await fastify.prisma.dealEvent.create({
        data: {
          dealId,
          actorId: request.user.id,
          event: 'REFUND',
          note: `คืนเงินให้ผู้ซื้อ: ${reason}`
        }
      });

      return reply.send({ message: 'คืนเงินสำเร็จ' });
    }
  );
};
