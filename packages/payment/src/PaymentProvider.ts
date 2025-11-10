import type {
  CreateChargeInput,
  ChargeResult,
  RefundInput,
  RefundResult,
  WebhookPayload,
  WebhookVerificationResult,
} from "./types";

/**
 * PaymentProvider abstraction
 * Implementations: MockPromptPay (now), Omise, GB PrimePay, Xendit (future)
 */
export abstract class PaymentProvider {
  abstract readonly name: string;

  /**
   * Create a charge and generate QR code
   */
  abstract createCharge(input: CreateChargeInput): Promise<ChargeResult>;

  /**
   * Refund a payment
   */
  abstract refund(input: RefundInput): Promise<RefundResult>;

  /**
   * Verify and parse webhook payload
   */
  abstract verifyWebhook(payload: WebhookPayload): Promise<WebhookVerificationResult>;
}
