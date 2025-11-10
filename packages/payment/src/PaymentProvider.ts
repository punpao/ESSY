import type {
  CreateChargeRequest,
  CreateChargeResponse,
  RefundRequest,
  RefundResponse,
  WebhookPayload,
  WebhookVerificationResult,
} from "./types";

export interface IPaymentProvider {
  readonly provider: string;

  createCharge(request: CreateChargeRequest): Promise<CreateChargeResponse>;

  refund(request: RefundRequest): Promise<RefundResponse>;

  verifyWebhook(
    payload: WebhookPayload,
    secret: string
  ): Promise<WebhookVerificationResult>;
}
