import QRCode from 'qrcode';
import { PaymentProvider, ChargeRequest, ChargeResponse, RefundRequest, RefundResponse, WebhookPayload } from '../PaymentProvider';

export class MockPromptPayProvider extends PaymentProvider {
  async createCharge(request: ChargeRequest): Promise<ChargeResponse> {
    const providerRef = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Generate Thai PromptPay QR format (simplified mock)
    // Real format: https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Documents/ThaiQRCode_Payment_Standard.pdf
    const qrString = this.generatePromptPayQR(
      request.recipientPromptPayId,
      request.amountSatang / 100,
      providerRef
    );

    // Generate QR code data URL for display
    const qrDataUrl = await QRCode.toDataURL(qrString);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 min expiry

    return {
      qrString,
      qrDataUrl,
      providerRef,
      expiresAt,
    };
  }

  async refund(request: RefundRequest): Promise<RefundResponse> {
    // Mock refund - always succeeds
    const refundRef = `refund_${Date.now()}`;
    
    console.log(`[MockPromptPay] Refunding ${request.amountSatang} satang for ${request.providerRef}`);
    
    return {
      refundRef,
      success: true,
    };
  }

  verifyWebhook(payload: WebhookPayload, secret: string): boolean {
    // Mock verification - in production, verify HMAC signature
    if (payload.signature === `mock_sig_${secret}`) {
      return true;
    }
    // For demo, accept any webhook without signature
    return true;
  }

  private generatePromptPayQR(promptPayId: string, amount: number, ref: string): string {
    // Simplified PromptPay QR format (mock)
    // Real implementation would follow BOT Thai QR standard
    return JSON.stringify({
      promptPayId,
      amount,
      ref,
      currency: 'THB',
    });
  }
}
