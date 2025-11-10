import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate, requireRole } from '../auth';
import { generatePaylinkToken } from '@thai-escrow/core';
import { escrowMachine } from '@thai-escrow/core';
import { config } from '../config';

const CreateDealSchema = z.object({
  title: z.string().min(1).max(200),
  amount_satang: z.number().int().positive(),
  buyer_note: z.string().optional(),
});

const AddTrackingSchema = z.object({
  tracking_number: z.string().min(1),
  courier: z.string().min(1),
});

export default async function dealRoutes(fastify: FastifyInstance) {
  // Create deal (seller only)
  fastify.post('/deals', async (request, reply) => {
    const user = await authenticate(request);
    const body = CreateDealSchema.parse(request.body);
    
    // Check if user has seller profile
    const sellerProfile = await prisma.sellerProfile.findUnique({
      where: { user_id: user.id },
    });
    
    if (!sellerProfile) {
      return reply.code(403).send({ error: 'Seller profile required' });
    }
    
    const paylink_token = generatePaylinkToken();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const deal = await prisma.deal.create({
      data: {
        title: body.title,
        amount_satang: body.amount_satang,
        currency: 'THB',
        seller_id: user.id,
        status: 'PENDING',
        paylink_token,
        expires_at,
        buyer_note: body.buyer_note,
      },
    });
    
    // Log event
    await prisma.dealEvent.create({
      data: {
        deal_id: deal.id,
        event_type: 'deal_created',
        actor_id: user.id,
        metadata: { title: deal.title, amount: deal.amount_satang },
      },
    });
    
    const paylink_url = `${config.app.baseUrl}/pay/${paylink_token}`;
    
    return { deal, paylink_url };
  });

  // Get deal details
  fastify.get('/deals/:id', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    
    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            display_name: true,
            seller_profile: {
              select: {
                verified: true,
                reputation_score: true,
                promptpay_name: true,
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            display_name: true,
          },
        },
        payments: true,
      },
    });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    // Only seller, buyer, or admin can view
    if (deal.seller_id !== user.id && deal.buyer_id !== user.id && user.role !== 'admin') {
      return reply.code(403).send({ error: 'Forbidden' });
    }
    
    return { deal };
  });

  // Add tracking (seller only)
  fastify.post('/deals/:id/ship', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    const body = AddTrackingSchema.parse(request.body);
    
    const deal = await prisma.deal.findUnique({ where: { id } });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    if (deal.seller_id !== user.id) {
      return reply.code(403).send({ error: 'Only seller can add tracking' });
    }
    
    // Validate state transition
    const context = { status: deal.status, tracking_number: body.tracking_number };
    if (!escrowMachine.canTransition(context, 'add_tracking')) {
      return reply.code(400).send({ error: 'Invalid state transition' });
    }
    
    const newStatus = escrowMachine.transition(context, 'add_tracking');
    const auto_release_at = new Date(Date.now() + config.escrow.autoReleaseHours * 60 * 60 * 1000);
    
    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        status: newStatus,
        tracking_number: body.tracking_number,
        courier: body.courier,
        auto_release_at,
      },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: deal.id,
        event_type: 'tracking_added',
        actor_id: user.id,
        metadata: { tracking_number: body.tracking_number, courier: body.courier },
      },
    });
    
    return { deal: updatedDeal };
  });

  // Confirm receipt (buyer only)
  fastify.post('/deals/:id/confirm', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    
    const deal = await prisma.deal.findUnique({ where: { id } });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    if (deal.buyer_id !== user.id) {
      return reply.code(403).send({ error: 'Only buyer can confirm' });
    }
    
    const context = { status: deal.status };
    if (!escrowMachine.canTransition(context, 'confirm_received')) {
      return reply.code(400).send({ error: 'Invalid state transition' });
    }
    
    const newStatus = escrowMachine.transition(context, 'confirm_received');
    
    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        status: newStatus,
        delivered_at: new Date(),
      },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: deal.id,
        event_type: 'confirmed_received',
        actor_id: user.id,
      },
    });
    
    // Add positive reputation
    await prisma.reputationEvent.create({
      data: {
        seller_id: deal.seller_id,
        type: 'positive',
        weight: 0.3,
        note: `Deal ${deal.id} completed successfully`,
      },
    });
    
    return { deal: updatedDeal };
  });

  // Cancel deal (seller only, PENDING state only)
  fastify.post('/deals/:id/cancel', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    
    const deal = await prisma.deal.findUnique({ where: { id } });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    if (deal.seller_id !== user.id) {
      return reply.code(403).send({ error: 'Only seller can cancel' });
    }
    
    if (deal.status !== 'PENDING') {
      return reply.code(400).send({ error: 'Can only cancel PENDING deals' });
    }
    
    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: { status: 'REFUND' },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: deal.id,
        event_type: 'cancelled',
        actor_id: user.id,
      },
    });
    
    return { deal: updatedDeal };
  });
}
