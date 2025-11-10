import { PrismaClient } from '@prisma/client';
import {
  MockPromptPayProvider,
  mockPromptPayProvider,
} from '@thai-escrow/payment';
import { DealService } from './dealService';

export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private dealService: DealService,
    private provider: MockPromptPayProvider = mockPromptPayProvider
  ) {}

  async createCharge(dealId: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id: dealId },
    });
    if (!deal) {
      throw new Error('Deal not found');
    }
    if (deal.status !== 'PENDING') {
      throw new Error('Deal not payable');
    }

    const result = await this.provider.createCharge({
      dealId: deal.id,
      amountSatang: deal.amountSatang,
      currency: 'THB',
      description: deal.title,
    });

    await this.prisma.payment.upsert({
      where: { dealId: deal.id },
      update: {
        providerRef: result.providerRef,
        status: 'INIT',
      },
      create: {
        dealId: deal.id,
        provider: this.provider.name,
        providerRef: result.providerRef,
        status: 'INIT',
      },
    });

    return result;
  }

  async handleWebhook(rawPayload: unknown, secret: string) {
    const verification = await this.provider.verifyWebhook(rawPayload, secret);
    if (!verification.valid || !verification.dealId) {
      throw new Error('Invalid webhook payload');
    }

    const deal = await this.prisma.deal.findUnique({
      where: { id: verification.dealId },
    });
    if (!deal) {
      throw new Error('Deal not found');
    }

    const status = verification.status === 'PAID' ? 'PAID' : 'FAILED';

    await this.dealService.updatePaymentStatus(
      deal.id,
      status,
      verification.providerRef ?? 'unknown'
    );

    if (status === 'PAID') {
      const result = await this.dealService.transitionState(
        { ...deal },
        { type: 'PAYMENT_PAID' },
        {
          hasPayment: true,
          hasTracking: Boolean(deal.trackingNumber),
          autoReleaseHours: this.dealService.autoReleaseHours,
        }
      );
      return result;
    }

    return { changed: false };
  }

  async refund(dealId: string, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { dealId },
    });
    if (!payment) {
      throw new Error('Payment not found');
    }
    await this.provider.refund({ paymentId: payment.id, reason });
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });
    await this.dealService.refund(dealId);
  }
}
