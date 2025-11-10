import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from "./types";

/**
 * Abstract payment provider interface.
 * Implementations: MockPromptPayProvider, OpnProvider, OmiseProvider, etc.
 */
export interface PaymentProvider {
  /**
   * Create a payment charge (e.g., QR code for PromptPay)
   */
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;

  /**
   * Process a refund
   */
  refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Verify webhook signature and parse payload
   */
  verifyWebhook(payload: WebhookPayload): Promise<boolean>;

  /**
   * Get provider name
   */
  getName(): string;
}
