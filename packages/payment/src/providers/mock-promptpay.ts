import QRCode from 'qrcode';
import { ulid } from 'ulid';
import crypto from 'crypto';
import {
  PaymentProvider,
  CreateChargeRequest,
  CreateChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from '../types';

/**
 * Mock PromptPay Provider
 * Simulates PromptPay QR payments for development
 * 
 * In production, replace with real Thai PSP:
 * - Omise/Opn (https://www.opn.ooo/)
 * - GB PrimePay (https://www.gbprimepay.com/)
 * - Xendit (https://www.xendit.co/en-th/)
 */
export class MockPromptPayProvider implements PaymentProvider {
  name = 'mock_promptpay';
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    this.webhookSecret = webhookSecret;
  }

  async createCharge(request: CreateChargeRequest): Promise<CreateChargeResponse> {
    const { deal } = request;
    
    // Generate mock provider reference
    const providerRef = `MOCK_PP_${ulid()}`;
    
    // Create PromptPay QR string format
    // Format: PROMPTPAY|MERCHANT_ID|AMOUNT|REF
    const amountTHB = (deal.amountSatang / 100).toFixed(2);
    const qrData = `PROMPTPAY|0899999999|${amountTHB}|${providerRef}`;
    
    // Generate QR code as base64 data URL
    const qrString = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 400,
      margin: 1,
    });
    
    // QR expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    
    return {
      qrString,
      providerRef,
      expiresAt,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    const { providerRef } = request;
    
    // Mock refund - just generate a refund reference
    const refundRef = `REFUND_${providerRef}_${ulid()}`;
    
    // In production, call real PSP refund API
    console.log(`[MockPromptPay] Refunding ${providerRef} -> ${refundRef}`);
    
    return {
      success: true,
      refundRef,
    };
  }

  verifyWebhook(payload: WebhookPayload, signature: string): boolean {
    // Create HMAC signature
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Helper to generate webhook signature for testing
   */
  generateWebhookSignature(payload: WebhookPayload): string {
    return crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
}
