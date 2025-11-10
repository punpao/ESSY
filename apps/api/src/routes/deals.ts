import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppConfig } from '../config.js';
import { generateDealId, generatePaylinkToken } from '../utils/id.js';
import { applyDealTransition } from '../services/dealState.js';

const dealResponse = (deal: any) => ({
  id: deal.id,
  title: deal.title,
  amountSatang: deal.amountSatang,
  currency: deal.currency,
  status: deal.status,
  sellerId: deal.sellerId,
  buyerId: deal.buyerId,
  paylinkToken: deal.paylinkToken,
  expiresAt: deal.expiresAt,
  trackingNumber: deal.trackingNumber,
  courier: deal.courier,
  deliveredAt: deal.deliveredAt,
  autoReleaseAt: deal.autoReleaseAt,
  createdAt: deal.createdAt,
  updatedAt: deal.updatedAt
});

export const dealRoutes = async (fastify: FastifyInstance, config: AppConfig) => {
  const createSchema = z.object({
    title: z.string().min(3),
    amountTHB: z.number().positive(),
    buyerEmail: z.string().email().optional(),
    note: z.string().max(500).optional()
  });

  fastify.post(
    '/api/v1/deals',
    { preHandler: [fastify.authenticate, fastify.authorize(['seller'])] },
    async (request, reply) => {
      const { title, amountTHB, buyerEmail } = createSchema.parse(request.body);

      const sellerProfile = await fastify.prisma.sellerProfile.findUnique({
        where: { userId: request.user.id }
      });
      if (!sellerProfile || sellerProfile.kycStatus !== 'VERIFIED') {
        return reply
          .code(400)
          .send({ message: 'ต้องผ่านการยืนยันตัวตนก่อนสร้าง Paylink' });
      }

      const amountSatang = Math.round(amountTHB * 100);
      const paylinkToken = generatePaylinkToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const dealId = generateDealId();

      const deal = await fastify.prisma.deal.create({
        data: {
          id: dealId,
          title,
          amountSatang,
          sellerId: request.user.id,
          status: 'PENDING',
          paylinkToken,
          expiresAt,
          currency: 'THB'
        }
      });

      await fastify.prisma.dealEvent.create({
        data: {
          dealId: deal.id,
          actorId: request.user.id,
          event: 'CREATE',
          note: 'สร้างเพย์ลิงก์ใหม่'
        }
      });

      if (buyerEmail) {
        await fastify.prisma.dealEvent.create({
          data: {
            dealId: deal.id,
            actorId: request.user.id,
            event: 'BUYER_EMAIL',
            note: `แชร์เพย์ลิงก์ไปยัง ${buyerEmail}`
          }
        });
      }

      return reply.code(201).send({
        deal: dealResponse(deal),
        paylinkUrl: `${config.appBaseUrl}/pay/${paylinkToken}`
      });
    }
  );

  fastify.get(
    '/api/v1/deals/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const id = z.string().parse((request.params as any).id);
      const deal = await fastify.prisma.deal.findUnique({
        where: { id },
        include: {
          payment: true,
          seller: true,
          buyer: true,
          dispute: true
        }
      });
      if (!deal) {
        return reply.code(404).send({ message: 'ไม่พบรายการ' });
      }
      if (![deal.sellerId, deal.buyerId].includes(request.user.id) && request.user.role !== 'admin') {
        return reply.code(403).send({ message: 'คุณไม่มีสิทธิ์ดูรายการนี้' });
      }
      return reply.send({ deal: dealResponse(deal) });
    }
  );

  fastify.get('/api/v1/paylinks/:token', async (request, reply) => {
    const token = z.string().length(10).parse((request.params as any).token);
    const deal = await fastify.prisma.deal.findUnique({
      where: { paylinkToken: token },
      include: {
        seller: {
          include: {
            sellerProfile: true
          }
        }
      }
    });

    if (!deal) {
      return reply.code(404).send({ message: 'ไม่พบเพย์ลิงก์นี้' });
    }

    const sellerProfile = deal.seller.sellerProfile;

    return reply.send({
      deal: {
        id: deal.id,
        title: deal.title,
        status: deal.status,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        sellerDisplayName: deal.seller.displayName,
        sellerVerified: sellerProfile?.verified ?? false,
        promptpayName: sellerProfile?.promptpayName ?? null
      }
    });
  });

  const shipSchema = z.object({
    trackingNumber: z.string().min(3),
    courier: z.string().min(2),
    delivered: z.boolean().optional(),
    deliveredAt: z.string().datetime().optional()
  });

  fastify.post(
    '/api/v1/deals/:id/ship',
    { preHandler: [fastify.authenticate, fastify.authorize(['seller'])] },
    async (request, reply) => {
      const id = z.string().parse((request.params as any).id);
      const { trackingNumber, courier, delivered, deliveredAt } = shipSchema.parse(request.body);

      const deal = await fastify.prisma.deal.findFirst({
        where: { id, sellerId: request.user.id },
        include: { dispute: true }
      });

      if (!deal) {
        return reply.code(404).send({ message: 'ไม่พบรายการของคุณ' });
      }
      if (!['HOLD', 'SHIPPED'].includes(deal.status)) {
        return reply.code(400).send({ message: 'สามารถใส่เลขพัสดุได้หลังจากลูกค้าชำระแล้ว' });
      }

      const additionalData: any = {
        trackingNumber,
        courier
      };

      let updated = { ...deal };

      if (deal.status === 'HOLD') {
        const transitioned = await applyDealTransition(
          fastify.prisma,
          deal,
          { type: 'SELLER_SHIP' },
          request.user.id,
          additionalData
        );
        updated = { ...transitioned, dispute: deal.dispute };
      } else {
        const persisted = await fastify.prisma.deal.update({
          where: { id: deal.id },
          data: additionalData
        });
        updated = { ...persisted, dispute: deal.dispute };
      }

      if (delivered) {
        const deliveredAtDate = deliveredAt ? new Date(deliveredAt) : new Date();
        const autoReleaseAt = new Date(
          deliveredAtDate.getTime() + config.autoReleaseHours * 60 * 60 * 1000
        );
        const transitioned = await applyDealTransition(
          fastify.prisma,
          { ...updated, deliveredAt: deliveredAtDate, dispute: deal.dispute },
          { type: 'MARK_DELIVERED' },
          request.user.id,
          {
            deliveredAt: deliveredAtDate,
            autoReleaseAt
          },
          { delivered: true }
        );
        updated = { ...transitioned, dispute: deal.dispute };
      }

      return reply.send({
        message: 'บันทึกสถานะจัดส่งแล้ว',
        deal: dealResponse(updated)
      });
    }
  );

  fastify.post(
    '/api/v1/deals/:id/confirm',
    { preHandler: [fastify.authenticate, fastify.authorize(['buyer'])] },
    async (request, reply) => {
      const id = z.string().parse((request.params as any).id);
      const deal = await fastify.prisma.deal.findFirst({
        where: { id, buyerId: request.user.id },
        include: { dispute: true }
      });
      if (!deal) {
        return reply.code(404).send({ message: 'ไม่พบรายการของคุณ' });
      }
      if (deal.status !== 'SHIPPED') {
        return reply.code(400).send({ message: 'ต้องอยู่ในสถานะรอผู้ซื้อยืนยัน' });
      }

      const releasedDeal = await applyDealTransition(
        fastify.prisma,
        deal,
        { type: 'BUYER_CONFIRM' },
        request.user.id,
        {
          autoReleaseAt: null
        }
      );

      await fastify.queues.reputation.add('recalculate', { sellerId: deal.sellerId });

      return reply.send({
        message: 'ยืนยันรับสินค้าแล้ว เงินจะถูกโอนไปยังผู้ขายทันที',
        deal: dealResponse(releasedDeal)
      });
    }
  );

  fastify.post(
    '/api/v1/deals/:id/cancel',
    { preHandler: [fastify.authenticate, fastify.authorize(['seller'])] },
    async (request, reply) => {
      const id = z.string().parse((request.params as any).id);
      const deal = await fastify.prisma.deal.findFirst({
        where: { id, sellerId: request.user.id },
        include: { dispute: true, payment: true }
      });
      if (!deal) {
        return reply.code(404).send({ message: 'ไม่พบรายการของคุณ' });
      }
      if (deal.status !== 'PENDING') {
        return reply.code(400).send({ message: 'ยกเลิกได้เฉพาะดีลที่ยังไม่ชำระ' });
      }
      if (deal.payment && deal.payment.status !== 'INIT') {
        return reply.code(400).send({ message: 'ไม่สามารถยกเลิกหลังชำระเงิน' });
      }

      const cancelled = await applyDealTransition(
        fastify.prisma,
        deal,
        { type: 'CANCEL_UNPAID' },
        request.user.id
      );

      return reply.send({
        message: 'ยกเลิกดีลเรียบร้อย',
        deal: dealResponse(cancelled)
      });
    }
  );
};
