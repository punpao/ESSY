import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';
import { getDefaultPaymentProvider } from '../../lib/payment';

export async function paylinkRoutes(app: FastifyInstance) {
  app.get('/:token', async (request, reply) => {
    const { token } = request.params as { token: string };
    const deal = await prisma.deal.findUnique({
      where: { paylinkToken: token },
      include: {
        seller: {
          include: {
            sellerProfile: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!deal) return reply.notFound();

    let payment = deal.payments[0];
    const now = new Date();

    if (!payment || (payment.status === 'INIT' && payment.expiresAt && payment.expiresAt < now)) {
      if (!deal.seller?.sellerProfile) {
        return reply.status(400).send({ error: 'seller not ready' });
      }
      const provider = getDefaultPaymentProvider();
      const charge = await provider.createCharge({
        id: deal.id,
        amountSatang: deal.amountSatang,
        currency: deal.currency,
        title: deal.title,
        sellerPromptpayId: deal.seller.sellerProfile.promptpayId
      });
      payment = await prisma.payment.create({
        data: {
          dealId: deal.id,
          provider: provider.name,
          providerRef: charge.providerRef,
          status: 'INIT',
          qrString: charge.qrString,
          expiresAt: charge.expiresAt
        }
      });
    }

    return reply.send({
      deal: {
        id: deal.id,
        title: deal.title,
        amountSatang: deal.amountSatang,
        status: deal.status,
        seller: {
          id: deal.seller.id,
          displayName: deal.seller.displayName,
          promptpayName: deal.seller.sellerProfile?.promptpayName
        },
        payment
      }
    });
  });
}
