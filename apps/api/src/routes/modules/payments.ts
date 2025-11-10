import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { getDefaultPaymentProvider, getPaymentProvider } from '../../lib/payment';
import { config } from '../../config';
import { transitionDeal } from '../../services/dealService';

const paymentCreateSchema = z.object({
  dealId: z.string()
});

const webhookSchema = z.object({
  provider: z.string().default('mock_promptpay'),
  providerRef: z.string(),
  dealId: z.string(),
  status: z.enum(['PAID', 'FAILED']),
  buyerEmail: z.string().email().optional()
});

const refundSchema = z.object({
  note: z.string().optional()
});

export async function paymentRoutes(app: FastifyInstance) {
  app.post(
    '/create',
    { preHandler: app.authorize(['buyer', 'seller', 'admin']) },
    async (request, reply) => {
      const { dealId } = paymentCreateSchema.parse(request.body);
      const deal = await prisma.deal.findUnique({
        where: { id: dealId },
        include: {
          sellerProfile: true
        }
      });
      if (!deal) return reply.notFound();
      if (!deal.sellerProfile) return reply.status(400).send({ error: 'Seller missing PromptPay profile' });
      if (deal.status !== 'PENDING') {
        return reply.status(400).send({ error: 'ชำระเงินได้เฉพาะคำสั่งซื้อรอชำระ' });
      }

      const provider = getDefaultPaymentProvider();
      const charge = await provider.createCharge({
        id: deal.id,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        title: deal.title,
        sellerPromptpayId: deal.sellerProfile.promptpayId
      });

      await prisma.payment.create({
        data: {
          dealId: deal.id,
          provider: provider.name,
          providerRef: charge.providerRef,
          status: 'INIT',
          qrString: charge.qrString,
          expiresAt: charge.expiresAt
        }
      });

      return reply.send({ qrString: charge.qrString, providerRef: charge.providerRef, expiresAt: charge.expiresAt });
    }
  );

  app.post('/webhook/mock', async (request, reply) => {
    const body = webhookSchema.parse(request.body);
    const signature = (request.headers['x-mock-signature'] as string) ?? null;
    const provider = getPaymentProvider(body.provider);
    const verified = await provider.verifyWebhook({
      signature,
      payload: body,
      secret: config.paymentWebhookSecret
    });
    if (!verified.valid) {
      return reply.status(400).send({ error: 'invalid signature' });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: verified.providerRef ?? body.providerRef },
      include: { deal: true }
    });
    if (!payment) return reply.notFound();

    if (body.status === 'PAID') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          paidAt: new Date()
        }
      });
      let buyerId = payment.deal.buyerId;
      if (!buyerId && body.buyerEmail) {
        const buyer = await prisma.user.upsert({
          where: { email: body.buyerEmail },
          update: {},
          create: {
            email: body.buyerEmail,
            displayName: body.buyerEmail.split('@')[0],
            role: 'buyer'
          }
        });
        buyerId = buyer.id;
      }
      await transitionDeal({
        dealId: payment.dealId,
        event: { type: 'PAYMENT_HOLD' },
        context: { actorId: 'payment-webhook', actorRole: 'system', note: 'Payment confirmed' },
        data: {
          buyerId: buyerId ?? payment.deal.buyerId ?? null
        }
      });
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED'
        }
      });
    }

    return reply.send({ ok: true });
  });

  app.post(
    '/:dealId/refund',
    { preHandler: app.authorize(['admin']) },
    async (request, reply) => {
      const { dealId } = z.object({ dealId: z.string() }).parse(request.params);
      const { note } = refundSchema.parse(request.body);

      const payment = await prisma.payment.findFirst({
        where: { dealId },
        orderBy: { createdAt: 'desc' }
      });
      if (!payment) return reply.status(404).send({ error: 'payment not found' });

      const provider = getPaymentProvider(payment.provider);
      await provider.refund(payment.providerRef, 0);
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED'
        }
      });

      const updatedDeal = await transitionDeal({
        dealId,
        event: { type: 'ADMIN_RESOLVE_REFUND' },
        context: { actorId: request.user.id, actorRole: 'admin', note: note ?? 'Admin refund' }
      });

      return reply.send({ deal: updatedDeal });
    }
  );
}
