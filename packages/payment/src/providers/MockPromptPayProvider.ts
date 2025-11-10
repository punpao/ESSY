import QRCode from "qrcode";
import { PaymentProvider } from "../PaymentProvider";
import type {
  CreateChargeInput,
  ChargeResult,
  RefundInput,
  RefundResult,
  WebhookPayload,
  WebhookVerificationResult,
} from "../types";

/**
 * Mock PromptPay Provider for MVP
 * Simulates Thai PromptPay QR code generation without real PSP integration
 */
export class MockPromptPayProvider extends PaymentProvider {
  readonly name = "mock_promptpay";
  private webhookSecret: string;

  constructor(webhookSecret: string) {
    super();
    this.webhookSecret = webhookSecret;
  }

  /**
   * Generate mock PromptPay QR code
   * Format: 00020101021...  (real PromptPay uses EMVCo format)
   */
  async createCharge(input: CreateChargeInput): Promise<ChargeResult> {
    try {
      // Generate a unique provider reference
      const providerRef = `MOCK_PP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Mock PromptPay payload (simplified)
      // Real format would be EMVCo QR specification
      const promptpayPayload = this.generatePromptPayString(
        input.promptpayId,
        input.amountSatang,
        providerRef
      );

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(promptpayPayload, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 300,
      });

      return {
        success: true,
        providerRef,
        qrString: promptpayPayload,
        qrDataUrl,
      };
    } catch (error) {
      return {
        success: false,
        providerRef: "",
        qrString: "",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Mock refund - just logs and returns success
   */
  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const refundRef = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log(`[MockPromptPay] Refunding ${input.amountSatang} satang for ${input.providerRef}`);

      return {
        success: true,
        refundRef,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Verify webhook signature and payload
   */
  async verifyWebhook(payload: WebhookPayload): Promise<WebhookVerificationResult> {
    try {
      // Simple signature verification (in production use HMAC-SHA256)
      if (payload.signature !== this.webhookSecret) {
        return {
          valid: false,
          error: "Invalid webhook signature",
        };
      }

      return {
        valid: true,
        providerRef: payload.providerRef,
        status: payload.status,
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Generate mock PromptPay string (simplified version)
   * Real PromptPay uses EMVCo specification with TLV format
   */
  private generatePromptPayString(promptpayId: string, amountSatang: number, ref: string): string {
    // This is a simplified mock format
    // Real PromptPay string format: https://www.bot.or.th/English/PaymentSystems/StandardPS/Documents/ThaiQRCode_Payment_Standard.pdf
    
    const amountTHB = (amountSatang / 100).toFixed(2);
    
    return [
      "00020101", // Payload Format Indicator
      "021230", // Point of Initiation Method
      `29${this.padTLV(promptpayId)}`, // Merchant Account (PromptPay ID)
      "5303764", // Currency: THB (764)
      `54${amountTHB.length}${amountTHB}`, // Amount
      "5802TH", // Country: Thailand
      `62${this.padTLV(ref)}`, // Additional Data (Reference)
      "6304", // CRC placeholder
      "MOCK",
    ].join("");
  }

  private padTLV(value: string): string {
    const len = value.length.toString().padStart(2, "0");
    return `${len}${value}`;
  }
}
