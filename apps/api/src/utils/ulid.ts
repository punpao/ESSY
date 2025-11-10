import { ulid } from "ulid";

export function generateULID(): string {
  return ulid();
}

export function generatePaylinkToken(): string {
  return `pay_${ulid()}`;
}
