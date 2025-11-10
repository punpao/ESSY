export interface CreateChargeInput {
  dealId: string;
  amountSatang: number;
  currency: string;
  description: string;
  promptpayId: string;
}

export interface ChargeResult {
  success: boolean;
  providerRef: string;
  qrString: string;
  qrDataUrl?: string;
  error?: string;
}

export interface RefundInput {
  providerRef: string;
  amountSatang: number;
  reason: string;
}

export interface RefundResult {
  success: boolean;
  refundRef?: string;
  error?: string;
}

export interface WebhookPayload {
  event: string;
  providerRef: string;
  status: string;
  data: Record<string, unknown>;
  signature?: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  providerRef?: string;
  status?: string;
  error?: string;
}
