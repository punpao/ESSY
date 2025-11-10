import { ulid } from 'ulid';

export function generateULID(): string {
  return ulid();
}

export function generatePaylinkToken(): string {
  return `pl_${ulid().toLowerCase()}`;
}

export function calculateAutoReleaseDate(deliveredAt: Date, hoursToWait: number): Date {
  const releaseDate = new Date(deliveredAt);
  releaseDate.setHours(releaseDate.getHours() + hoursToWait);
  return releaseDate;
}

export function calculateReputationScore(
  releasedCount: number,
  disputeCount: number
): number {
  const raw = releasedCount * 0.3 - disputeCount * 1.0;
  // Sigmoid normalization: 0-100
  return Math.round((100 / (1 + Math.exp(-raw / 10))) * 10) / 10;
}

export function formatThaiCurrency(satang: number): string {
  const baht = satang / 100;
  return `฿${baht.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseDateOrNull(value: any): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
