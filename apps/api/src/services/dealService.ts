import { randomBytes } from 'crypto';
import { ulid } from 'ulid';
import { PrismaClient, Deal, PaymentStatus } from '@prisma/client';
import {
  transitionEscrowState,
  getAutoReleaseAt,
} from '@thai-escrow/core';
import type { CreateDealInput, SetTrackingInput } from '@thai-escrow/core';
import { recordDealEvent } from '../utils/audit';

export class DealService {
  constructor(
    private prisma: PrismaClient,
    public readonly autoReleaseHours: number
  ) {}

  async createDeal(input: CreateDealInput & { sellerId: string }) {
    const dealId = ulid();
    const paylinkToken = randomBytes(12).toString('hex');
    const amountSatang = Math.round(input.amountThb * 100);

    const deal = await this.prisma.deal.create({
      data: {
        id: dealId,
        title: input.title,
        amountSatang,
        currency: 'THB',
        sellerId: input.sellerId,
        status: 'PENDING',
        paylinkToken,
        buyerNote: input.buyerNote ?? null,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    await recordDealEvent(this.prisma, deal.id, 'CREATED', {
      sellerId: input.sellerId,
      amountSatang,
    });

    return deal;
  }

  async getDeal(id: string) {
    return this.prisma.deal.findUnique({
      where: { id },
      include: {
        seller: { include: { sellerProfile: true } },
        buyer: true,
        payment: true,
        dispute: {
          include: { evidence: true },
        },
      },
    });
  }

  async findByPaylink(token: string) {
    return this.prisma.deal.findUnique({
      where: { paylinkToken: token },
      include: { seller: { include: { sellerProfile: true } }, payment: true },
    });
  }

  async setTracking(deal: Deal, input: SetTrackingInput) {
    const transition = transitionEscrowState(
      deal.status as any,
      { type: 'SELLER_SET_TRACKING' },
      {
        hasPayment: deal.status !== 'PENDING',
        hasTracking: true,
        autoReleaseHours: this.autoReleaseHours,
      }
    );

    const updated = await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        trackingNumber: input.trackingNumber,
        courier: input.courier,
        status: transition.changed ? transition.to : deal.status,
        updatedAt: new Date(),
      },
    });

    await recordDealEvent(this.prisma, deal.id, 'TRACKING_SET', {
      trackingNumber: input.trackingNumber,
      courier: input.courier,
      status: updated.status,
    });

    return updated;
  }

  async transitionState(
    deal: Deal,
    event: Parameters<typeof transitionEscrowState>[1],
    context: Parameters<typeof transitionEscrowState>[2]
  ) {
    const result = transitionEscrowState(deal.status as any, event, context);
    if (result.changed) {
      const update: Partial<Deal> = {
        status: result.to,
        updatedAt: new Date(),
      };
      if (context.deliveredAt) {
        update.deliveredAt = context.deliveredAt;
        update.autoReleaseAt = getAutoReleaseAt(
          context.deliveredAt,
          this.autoReleaseHours
        );
      }
      await this.prisma.deal.update({
        where: { id: deal.id },
        data: update,
      });

      await recordDealEvent(this.prisma, deal.id, 'STATUS_CHANGED', {
        from: result.from,
        to: result.to,
        reason: result.reason,
      });
    } else {
      await recordDealEvent(this.prisma, deal.id, 'STATE_EVENT', {
        from: result.from,
        to: result.to,
        reason: result.reason,
      });
    }

    return result;
  }

  async markDelivered(deal: Deal, deliveredAt: Date) {
    const autoReleaseAt = getAutoReleaseAt(deliveredAt, this.autoReleaseHours);
    const updated = await this.prisma.deal.update({
      where: { id: deal.id },
      data: {
        deliveredAt,
        autoReleaseAt,
        updatedAt: new Date(),
      },
    });
    await recordDealEvent(this.prisma, deal.id, 'DELIVERED', {
      deliveredAt,
      autoReleaseAt,
    });
    return updated;
  }

  async releaseFunds(dealId: string) {
    await this.prisma.deal.update({
      where: { id: dealId },
      data: { status: 'RELEASED', updatedAt: new Date() },
    });
    await recordDealEvent(this.prisma, dealId, 'STATUS_CHANGED', {
      to: 'RELEASED',
    });
  }

  async refund(dealId: string) {
    await this.prisma.deal.update({
      where: { id: dealId },
      data: { status: 'REFUND', updatedAt: new Date() },
    });
    await recordDealEvent(this.prisma, dealId, 'STATUS_CHANGED', {
      to: 'REFUND',
    });
  }

  async listSellerDeals(sellerId: string) {
    return this.prisma.deal.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      include: { payment: true, dispute: true },
    });
  }

  async listBuyerDeals(buyerId: string) {
    return this.prisma.deal.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
      include: { payment: true, dispute: true },
    });
  }

  async adminList(status?: Deal['status']) {
    return this.prisma.deal.findMany({
      where: status ? { status } : {},
      include: { seller: true, buyer: true, payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updatePaymentStatus(
    dealId: string,
    status: PaymentStatus,
    providerRef: string
  ) {
    const payment = await this.prisma.payment.upsert({
      where: { dealId },
      update: {
        status,
        providerRef,
        paidAt: status === 'PAID' ? new Date() : undefined,
      },
      create: {
        dealId,
        provider: 'mock_promptpay',
        providerRef,
        status,
        paidAt: status === 'PAID' ? new Date() : undefined,
      },
    });

    await recordDealEvent(this.prisma, dealId, 'PAYMENT_STATUS', {
      status,
      providerRef,
    });

    return payment;
  }
}
