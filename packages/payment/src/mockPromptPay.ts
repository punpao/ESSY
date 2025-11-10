import type { PaymentProviderInterface, ChargeRequest, ChargeResponse, RefundRequest, RefundResponse, WebhookPayload } from './types';

/**
 * Mock PromptPay Provider
 * 
 * Simulates PromptPay QR code generation and payment webhooks.
 * In production, this would integrate with real PSPs like Opn, Omise, Xendit, or GB PrimePay.
 */
export class MockPromptPayProvider implements PaymentProviderInterface {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    // Generate a mock QR string (in real implementation, this would call PSP API)
    const providerRef = `MOCK_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Mock QR content: PromptPay format would be actual QR data
    // For demo, we'll use a simple format
    const qrString = `00020101021253037645802TH29370016A000000677010111${request.amountSatang}${providerRef}6304`;

    // QR expires in 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    return {
      qrString,
      providerRef,
      expiresAt,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - in production, this would call PSP API
    const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const providerRef = `MOCK_REFUND_${refundId}`;

    // Simulate successful refund
    return {
      refundId,
      providerRef,
      status: 'success',
    };
  }

  verifyWebhook(payload: WebhookPayload, secret: string): boolean {
    // Mock verification - in production, verify signature from PSP
    // For now, just check that secret matches
    if (payload.signature && payload.signature === secret) {
      return true;
    }
    
    // For mock, accept if event is 'payment.completed'
    return payload.event === 'payment.completed' || payload.event === 'payment.refunded';
  }
}
