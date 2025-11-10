import { PrismaClient } from '@prisma/client';
import type {
  DisputeOpenInput,
  DisputeEvidenceInput,
  DisputeResolveInput,
} from '@thai-escrow/core';
import { recordDealEvent } from '../utils/audit';
import { DealService } from './dealService';

export class DisputeService {
  constructor(
    private prisma: PrismaClient,
    private dealService: DealService
  ) {}

  async open(dealId: string, buyerId: string, input: DisputeOpenInput) {
    const deal = await this.prisma.deal.findUnique({ where: { id: dealId } });
    if (!deal) {
      throw new Error('Deal not found');
    }

    await this.dealService.transitionState(
      deal,
      { type: 'BUYER_OPEN_DISPUTE' },
      {
        hasPayment: true,
        hasTracking: Boolean(deal.trackingNumber),
        autoReleaseHours: this.dealService.autoReleaseHours,
      }
    );

    const dispute = await this.prisma.dispute.create({
      data: {
        dealId,
        openedById: buyerId,
        reasonText: input.reason,
        status: 'OPEN',
      },
    });

    await recordDealEvent(this.prisma, dealId, 'DISPUTE_OPENED', {
      disputeId: dispute.id,
      reason: input.reason,
    });

    return dispute;
  }

  async addEvidence(
    disputeId: string,
    userId: string,
    input: DisputeEvidenceInput
  ) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const evidence = await this.prisma.$transaction(async (tx) => {
      const created = await Promise.all(
        input.evidence.map((e) =>
          tx.evidence.create({
            data: {
              disputeId,
              uploadedById: userId,
              kind: e.kind,
              url: e.url,
              note: e.note ?? null,
            },
          })
        )
      );
      return created;
    });

    await recordDealEvent(this.prisma, dispute.dealId, 'DISPUTE_EVIDENCE', {
      count: evidence.length,
      disputeId,
    });

    return evidence;
  }

  async resolve(disputeId: string, input: DisputeResolveInput) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { deal: true },
    });
    if (!dispute) {
      throw new Error('Dispute not found');
    }

    const status =
      input.resolution === 'refund' ? 'RESOLVED_REFUND' : 'RESOLVED_RELEASE';

    await this.dealService.transitionState(
      dispute.deal,
      {
        type:
          input.resolution === 'refund'
            ? 'ADMIN_RESOLVE_REFUND'
            : 'ADMIN_RESOLVE_RELEASE',
      },
      {
        hasPayment: true,
        hasTracking: Boolean(dispute.deal.trackingNumber),
        autoReleaseHours: this.dealService.autoReleaseHours,
      }
    );

    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolutionNote: input.note ?? null,
        resolvedAt: new Date(),
      },
    });

    if (input.resolution === 'refund') {
      await this.dealService.refund(dispute.dealId);
    } else {
      await this.dealService.releaseFunds(dispute.dealId);
    }

    await recordDealEvent(this.prisma, dispute.dealId, 'DISPUTE_RESOLVED', {
      disputeId,
      resolution: input.resolution,
    });
  }

  async list(status?: string) {
    return this.prisma.dispute.findMany({
      where: status ? { status: status as any } : {},
      include: {
        deal: true,
        openedBy: true,
        evidence: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
