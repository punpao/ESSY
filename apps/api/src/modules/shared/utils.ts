import { randomBytes } from "crypto";
import { computeAutoReleaseAt, DealStatus, transitionEscrowState } from "@escrow/core";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";

export function thbToSatang(amount: number): number {
  return Math.round(amount * 100);
}

export function satangToThb(amount: number): number {
  return amount / 100;
}

export function generatePaylinkToken(): string {
  return randomBytes(16).toString("hex");
}

export async function logDealEvent(
  dealId: string,
  status: DealStatus,
  actorId: string,
  note: string
): Promise<void> {
  await prisma.dealEvent.create({
    data: {
      dealId,
      status,
      actorId,
      note
    }
  });
}

export function nextEscrowState(
  current: DealStatus,
  event: Parameters<typeof transitionEscrowState>[1],
  context: Parameters<typeof transitionEscrowState>[2]
): DealStatus {
  return transitionEscrowState(current, event, context);
}

export function computeAutoRelease(deliveredAt: Date | null | undefined): Date | null {
  return computeAutoReleaseAt(deliveredAt, env.autoReleaseHours);
}
