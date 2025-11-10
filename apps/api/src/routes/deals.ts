import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../lib/auth';
import { transitionDealStatus } from '../lib/escrow';
import { z } from 'zod';
import { ulid } from 'ulid';
import { randomBytes } from 'crypto';

export async function dealsRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post('/deals', async (request, reply) => {
    const user = await requireRole(request, reply, ['seller', 'admin']);

    // Check seller profile exists
    const profile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });

    if (!profile) {
      reply.code(400).send({ error: 'Seller profile required' });
      return;
    }

    const body = z
      .object({
        title: z.string().min(1),
        amount_satang: z.number().int().positive(),
        currency: z.string().default('THB'),
        buyer_note: z.string().optional(),
      })
      .parse(request.body);

    const dealId = ulid();
    const paylinkToken = randomBytes(32).toString('hex');

    const deal = await prisma.deal.create({
      data: {
        id: dealId,
        title: body.title,
        amount_satang: body.amount_satang,
        currency: body.currency,
        seller_id: user.id,
        paylink_token: paylinkToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'PENDING',
      },
    });

    const paylinkUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/pay/${paylinkToken}`;

    return {
      ...deal,
      paylink_url: paylinkUrl,
    };
  });

  // Get deal by ID
  fastify.get('/deals/:id', async (request, reply) => {
    const user = await requireAuth(request, reply);

    const params = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      include: {
        seller: {
          include: {
            seller_profile: true,
          },
        },
        buyer: true,
        payment: true,
        dispute: {
          include: {
            evidence: true,
          },
        },
      },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    // Check access
    if (deal.seller_id !== user.id && deal.buyer_id !== user.id && user.role !== 'admin') {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    return deal;
  });

  // Get deal by paylink token (public)
  fastify.get('/deals/paylink/:token', async (request, reply) => {
    const params = z.object({ token: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { paylink_token: params.token },
      include: {
        seller: {
          include: {
            seller_profile: true,
          },
        },
        payment: true,
      },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    return deal;
  });

  // Seller adds tracking
  fastify.post('/deals/:id/ship', async (request, reply) => {
    const user = await requireAuth(request, reply);

    const params = z.object({ id: z.string() }).parse(request.params);
    const body = z
      .object({
        tracking_number: z.string().min(1),
        courier: z.string().min(1),
      })
      .parse(request.body);

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    if (deal.seller_id !== user.id && user.role !== 'admin') {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    await transitionDealStatus(deal.id, { type: 'SHIPPED' }, user.id);

    const updated = await prisma.deal.update({
      where: { id: params.id },
      data: {
        tracking_number: body.tracking_number,
        courier: body.courier,
      },
    });

    return updated;
  });

  // Buyer confirms receipt
  fastify.post('/deals/:id/confirm', async (request, reply) => {
    const user = await requireAuth(request, reply);

    const params = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    if (deal.buyer_id !== user.id && user.role !== 'admin') {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    await transitionDealStatus(deal.id, { type: 'BUYER_CONFIRMED' }, user.id);

    const updated = await prisma.deal.findUnique({
      where: { id: params.id },
    });

    return updated;
  });

  // Cancel deal (only if PENDING and unpaid)
  fastify.post('/deals/:id/cancel', async (request, reply) => {
    const user = await requireAuth(request, reply);

    const params = z.object({ id: z.string() }).parse(request.params);

    const deal = await prisma.deal.findUnique({
      where: { id: params.id },
      include: { payment: true },
    });

    if (!deal) {
      reply.code(404).send({ error: 'Deal not found' });
      return;
    }

    if (deal.seller_id !== user.id && user.role !== 'admin') {
      reply.code(403).send({ error: 'Forbidden' });
      return;
    }

    if (deal.status !== 'PENDING' || deal.payment?.status === 'PAID') {
      reply.code(400).send({ error: 'Cannot cancel deal' });
      return;
    }

    // Delete deal (soft delete would be better in production)
    await prisma.deal.delete({
      where: { id: params.id },
    });

    return { success: true };
  });
}
