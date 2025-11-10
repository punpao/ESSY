import type {
  ChargeRequest,
  ChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
} from './types';

/**
 * Payment Provider Interface
 * Implementations: MockPromptPayProvider, OpnProvider, OmiseProvider, etc.
 */
export interface PaymentProvider {
  /**
   * Create a charge/payment request
   */
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;

  /**
   * Process a refund
   */
  refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: unknown, signature: string): boolean;

  /**
   * Parse webhook payload
   */
  parseWebhook(payload: unknown): WebhookPayload | null;

  /**
   * Provider name
   */
  readonly name: string;
}
