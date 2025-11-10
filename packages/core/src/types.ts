export type DealStatus =
  | 'PENDING'
  | 'HOLD'
  | 'SHIPPED'
  | 'RELEASED'
  | 'DISPUTE'
  | 'REFUND';

export type DealEventContext = {
  actorId: string;
  actorRole: 'buyer' | 'seller' | 'admin' | 'system';
  note?: string;
};

export interface DealStateContext {
  status: DealStatus;
  deliveredAt?: Date | null;
  autoReleaseAt?: Date | null;
}

export interface AutoReleaseRuleInput {
  deliveredAt?: Date | null;
  buyerConfirmedAt?: Date | null;
  now: Date;
  silentForHours: number;
}
