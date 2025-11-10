import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../lib/prisma";

export async function registerBuyerRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/buyer/deals",
    {
      preHandler: fastify.authorize(["buyer", "admin"]),
      schema: {
        querystring: z.object({
          status: z.string().optional()
        })
      }
    },
    async (request) => {
      const buyerId = request.user.userId;
      const { status } = request.query as { status?: string };

      const deals = await prisma.deal.findMany({
        where: {
          buyerId: request.user.role === "admin" ? undefined : buyerId,
          status: status as any
        },
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            include: {
              sellerProfile: true
            }
          },
          payments: true,
          disputes: true
        }
      });

      return { deals };
    }
  );

  fastify.get(
    "/buyer/disputes/:id",
    {
      preHandler: fastify.authorize(["buyer", "admin"])
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const dispute = await prisma.dispute.findUnique({
        where: { id },
        include: {
          deal: {
            include: {
              seller: true,
              payments: true
            }
          },
          evidences: true
        }
      });

      if (!dispute) {
        return reply.notFound("ไม่พบข้อพิพาท");
      }

      if (
        request.user.role !== "admin" &&
        dispute.openedById !== request.user.userId
      ) {
        return reply.forbidden("ต้องเป็นเจ้าของข้อพิพาทเท่านั้น");
      }

      return { dispute };
    }
  );
}
