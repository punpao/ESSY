import { DealStatus, DisputeStatus, PaymentStatus } from "@escrow/core";

export interface Deal {
  id: string;
  title: string;
  amountSatang: number;
  status: DealStatus;
  trackingNumber?: string | null;
  courier?: string | null;
  deliveredAt?: string | null;
  autoReleaseAt?: string | null;
  createdAt: string;
  paylinkToken: string;
  buyerNote?: string | null;
  seller: {
    displayName: string;
    sellerProfile?: {
      verified: boolean;
      promptpayName: string;
      reputationScore: number;
    } | null;
  };
  payments: Array<{
    id: string;
    status: PaymentStatus;
    paidAt?: string | null;
  }>;
  disputes: Array<{
    id: string;
    status: DisputeStatus;
  }>;
}

export interface Dispute {
  id: string;
  status: DisputeStatus;
  reasonText: string;
  reasonCode: string;
  resolutionNote?: string | null;
  createdAt: string;
  deal: Deal;
  evidences: Array<{
    id: string;
    kind: string;
    url: string;
    note?: string | null;
    createdAt: string;
  }>;
}
