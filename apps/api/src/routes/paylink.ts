import { FastifyInstance } from 'fastify';
import { prisma } from '../db';
import { MockPromptPayProvider } from '@essy/payment';
import { config } from '../config';
import { z } from 'zod';

const paymentProvider = new MockPromptPayProvider(config.appBaseUrl);

export async function paylinkRoutes(fastify: FastifyInstance) {
  // Public paylink page data
  fastify.get('/paylink/:token', async (request, reply) => {
    const { token } = z.object({ token: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { paylinkToken: token },
      include: {
        seller: { include: { sellerProfile: true } },
        payment: true,
      },
    });

    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }

    if (deal.expiresAt && deal.expiresAt < new Date()) {
      return reply.code(410).send({ error: 'Paylink expired' });
    }

    // Generate QR if payment not yet created
    let qrString = null;
    if (deal.payment && deal.payment.status === 'INIT') {
      const charge = await paymentProvider.createCharge({
        dealId: deal.id,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        description: deal.title,
      });

      await prisma.payment.update({
        where: { dealId: deal.id },
        data: { providerRef: charge.providerRef },
      });

      qrString = charge.qrString;
    }

    return {
      deal: {
        id: deal.id,
        title: deal.title,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        status: deal.status,
        seller: {
          displayName: deal.seller.displayName,
          verified: deal.seller.sellerProfile?.verified ?? false,
          promptpayName: deal.seller.sellerProfile?.promptpayName,
        },
      },
      payment: deal.payment
        ? {
            status: deal.payment.status,
            providerRef: deal.payment.providerRef,
          }
        : null,
      qrString,
    };
  });
}
