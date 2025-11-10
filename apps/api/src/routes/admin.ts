import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db';
import { authenticate } from '../auth';

const DealQuerySchema = z.object({
  status: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export default async function adminRoutes(fastify: FastifyInstance) {
  // Get all deals with filters
  fastify.get('/admin/deals', async (request, reply) => {
    const user = await authenticate(request);
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const query = DealQuerySchema.parse(request.query);
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;
    
    const where = query.status ? { status: query.status as any } : {};
    
    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              display_name: true,
              email: true,
              seller_profile: {
                select: { verified: true, reputation_score: true },
              },
            },
          },
          buyer: {
            select: {
              id: true,
              display_name: true,
              email: true,
            },
          },
          payments: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deal.count({ where }),
    ]);
    
    return {
      deals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  });

  // Get all disputes
  fastify.get('/admin/disputes', async (request, reply) => {
    const user = await authenticate(request);
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const query = DealQuerySchema.parse(request.query);
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);
    const skip = (page - 1) * limit;
    
    const where = query.status ? { status: query.status as any } : {};
    
    const [disputes, total] = await Promise.all([
      prisma.dispute.findMany({
        where,
        include: {
          deal: {
            include: {
              seller: {
                select: { id: true, display_name: true, email: true },
              },
              buyer: {
                select: { id: true, display_name: true, email: true },
              },
            },
          },
          evidence: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dispute.count({ where }),
    ]);
    
    // Calculate SLA status
    const disputesWithSLA = disputes.map((dispute) => {
      const hoursSinceCreated = (Date.now() - dispute.created_at.getTime()) / (1000 * 60 * 60);
      let sla_status = 'ok';
      
      if (dispute.status === 'OPEN' || dispute.status === 'NEED_MORE_INFO') {
        if (hoursSinceCreated > 72) sla_status = 'overdue';
        else if (hoursSinceCreated > 48) sla_status = 'warning';
        else if (hoursSinceCreated > 24) sla_status = 'due_soon';
      }
      
      return { ...dispute, sla_status, hours_since_created: hoursSinceCreated };
    });
    
    return {
      disputes: disputesWithSLA,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  });

  // Force release deal (admin override)
  fastify.post('/admin/deals/:id/release', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const deal = await prisma.deal.findUnique({ where: { id } });
    
    if (!deal) {
      return reply.code(404).send({ error: 'Deal not found' });
    }
    
    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        status: 'RELEASED',
        delivered_at: new Date(),
      },
    });
    
    await prisma.dealEvent.create({
      data: {
        deal_id: id,
        event_type: 'admin_force_release',
        actor_id: user.id,
      },
    });
    
    return { deal: updatedDeal };
  });

  // Get deal events (audit log)
  fastify.get('/admin/deals/:id/events', async (request, reply) => {
    const user = await authenticate(request);
    const { id } = request.params as { id: string };
    
    if (user.role !== 'admin') {
      return reply.code(403).send({ error: 'Admin only' });
    }
    
    const events = await prisma.dealEvent.findMany({
      where: { deal_id: id },
      orderBy: { created_at: 'desc' },
    });
    
    return { events };
  });
}
