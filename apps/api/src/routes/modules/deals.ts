import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ulid } from 'ulid';
import dayjs from 'dayjs';
import { prisma } from '../../lib/prisma';
import { transitionDeal } from '../../services/dealService';

export const createDealSchema = z.object({
  title: z.string().min(3),
  amountThb: z.number().positive(),
  buyerNote: z.string().optional()
});

const shipSchema = z.object({
  trackingNumber: z.string().min(5),
  courier: z.string().min(2),
  deliveredAt: z.string().datetime().optional()
});

export async function dealRoutes(app: FastifyInstance) {
  app.get(
    '/buyer',
    { preHandler: app.authorize(['buyer']) },
    async (request) => {
      const deals = await prisma.deal.findMany({
        where: { buyerId: request.user.id },
        include: {
          seller: true,
          dispute: true
        },
        orderBy: { createdAt: 'desc' }
      });
      return { deals };
    }
  );

  app.post(
    '/',
    { preHandler: app.authorize(['seller']) },
    async (request, reply) => {
      const body = createDealSchema.parse(request.body);
      const seller = await prisma.user.findUnique({
        where: { id: request.user.id },
        include: { sellerProfile: true }
      });
      if (!seller) {
        return reply.notFound('Seller not found');
      }
      if (!seller.sellerProfile) {
        return reply.status(400).send({ error: 'ต้องทำ KYC ก่อนสร้างเพย์ลิงก์' });
      }

      const amountSatang = Math.round(body.amountThb * 100);
      const paylinkToken = ulid();
      const dealId = ulid();
      const expiresAt = dayjs().add(7, 'day').toDate();

      const deal = await prisma.deal.create({
        data: {
          id: dealId,
          title: body.title,
          amountSatang,
          sellerId: seller.id,
          sellerProfileId: seller.sellerProfile.id,
          status: 'PENDING',
          paylinkToken,
          expiresAt
        }
      });

      const paylinkUrl = `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/pay/${paylinkToken}`;
      return reply.send({ deal, paylinkUrl });
    }
  );

  app.get(
    '/:id',
    { preHandler: app.authenticate },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const deal = await prisma.deal.findUnique({
        where: { id },
        include: {
          seller: true,
          buyer: true,
          payments: true,
          dispute: true
        }
      });
      if (!deal) return reply.notFound();
      if (![deal.sellerId, deal.buyerId].includes(request.user.id) && request.user.role !== 'admin') {
        return reply.forbidden();
      }
      return { deal };
    }
  );

  app.post(
    '/:id/ship',
    { preHandler: app.authorize(['seller']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const body = shipSchema.parse(request.body);
      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) return reply.notFound();
      if (deal.sellerId !== request.user.id) return reply.forbidden();
      if (!['HOLD', 'SHIPPED'].includes(deal.status)) {
        return reply.status(400).send({ error: 'สถานะไม่อนุญาตให้จัดส่ง' });
      }

      const deliveredAt = body.deliveredAt ? new Date(body.deliveredAt) : undefined;
      const updated = await transitionDeal({
        dealId: id,
        event: { type: 'SHIP' },
        context: { actorId: request.user.id, actorRole: 'seller', note: 'Seller updated tracking' },
        data: {
          trackingNumber: body.trackingNumber,
          courier: body.courier,
          deliveredAt
        }
      });
      return reply.send({ deal: updated });
    }
  );

  app.post(
    '/:id/confirm',
    { preHandler: app.authorize(['buyer']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const deal = await prisma.deal.findUnique({ where: { id } });
      if (!deal) return reply.notFound();
      if (deal.buyerId !== request.user.id) return reply.forbidden();
      if (!['SHIPPED', 'HOLD'].includes(deal.status)) {
        return reply.status(400).send({ error: 'สถานะไม่พร้อมให้ยืนยัน' });
      }
      const updated = await transitionDeal({
        dealId: id,
        event: { type: 'BUYER_CONFIRM' },
        context: { actorId: request.user.id, actorRole: 'buyer', note: 'Buyer confirmed receipt' }
      });
      return { deal: updated };
    }
  );

  app.post(
    '/:id/cancel',
    { preHandler: app.authorize(['seller']) },
    async (request, reply) => {
      const { id } = z.object({ id: z.string() }).parse(request.params);
      const deal = await prisma.deal.findUnique({
        where: { id },
        include: { payments: true }
      });
      if (!deal) return reply.notFound();
      if (deal.sellerId !== request.user.id) return reply.forbidden();
      if (deal.status !== 'PENDING') {
        return reply.status(400).send({ error: 'ยกเลิกได้เฉพาะสถานะรอชำระ' });
      }
      if (deal.payments.some((p) => p.status === 'PAID')) {
        return reply.status(400).send({ error: 'มีการชำระเงินแล้ว ไม่สามารถยกเลิก' });
      }
      const updated = await transitionDeal({
        dealId: id,
        event: { type: 'CANCEL' },
        context: { actorId: request.user.id, actorRole: 'seller', note: 'Seller cancelled before payment' }
      });
      return { deal: updated };
    }
  );
}
