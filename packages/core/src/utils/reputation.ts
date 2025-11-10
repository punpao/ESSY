import { reputationSnapshotSchema } from '../schemas/deal'

export const sigmoid = (value: number): number =>
  1 / (1 + Math.exp(-value))

export const computeReputationScore = (
  releasedDeals: number,
  disputeDeals: number
): number => {
  const adjusted = releasedDeals * 0.3 - disputeDeals * 1.0
  return Number(sigmoid(adjusted).toFixed(4))
}

export const evaluateSellerReputation = (input: {
  releasedCount: number
  disputeCount: number
}) => {
  const snapshot = reputationSnapshotSchema.parse({
    releasedCount: input.releasedCount,
    disputeCount: input.disputeCount
  })
  const score = computeReputationScore(
    snapshot.releasedCount,
    snapshot.disputeCount
  )

  return {
    score,
    tier:
      score > 0.8 ? 'gold' : score > 0.6 ? 'silver' : score > 0.4 ? 'bronze' : 'newbie'
  } as const
}
