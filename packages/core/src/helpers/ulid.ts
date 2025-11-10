import { ulid } from 'ulid';

/**
 * Generate a new ULID for deal IDs
 */
export function generateDealId(): string {
  return ulid();
}

/**
 * Generate a secure random token for paylinks
 */
export function generatePaylinkToken(): string {
  return ulid().toLowerCase();
}
