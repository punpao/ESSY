import { ChargeRequest, ChargeResponse, RefundRequest, RefundResponse, WebhookPayload } from './types';

/**
 * Payment Provider Interface
 * 
 * This abstraction allows us to swap between Mock PromptPay (MVP) and
 * real Thai payment gateways (Opn/Omise, Xendit, GB PrimePay) later.
 */
export interface PaymentProvider {
  readonly name: string;

  /**
   * Create a new payment charge
   */
  createCharge(request: ChargeRequest): Promise<ChargeResponse>;

  /**
   * Refund a payment
   */
  refund(request: RefundRequest): Promise<RefundResponse>;

  /**
   * Verify webhook signature and parse payload
   */
  verifyWebhook(signature: string, payload: string): Promise<WebhookPayload>;
}
