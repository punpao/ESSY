/**
 * Reputation calculation utilities
 * 
 * Score formula: sigmoid(#released * 0.3 - #disputes * 1.0)
 * Normalized to 0-100 scale
 */

interface ReputationInput {
  releasedCount: number;
  disputeCount: number;
  neutralCount?: number;
}

/**
 * Sigmoid function for smooth reputation curve
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Calculate reputation score
 * Returns a value between 0-100
 */
export function calculateReputationScore(input: ReputationInput): number {
  const { releasedCount, disputeCount, neutralCount = 0 } = input;
  
  // Weight factors
  const positiveWeight = 0.3;
  const negativeWeight = 1.0;
  const neutralWeight = 0.1;
  
  // Calculate raw score
  const rawScore =
    releasedCount * positiveWeight +
    neutralCount * neutralWeight -
    disputeCount * negativeWeight;
  
  // Apply sigmoid and normalize to 0-100
  const normalized = sigmoid(rawScore) * 100;
  
  return Math.round(normalized * 100) / 100; // Round to 2 decimal places
}

/**
 * Get reputation badge based on score
 */
export function getReputationBadge(score: number): string {
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'good';
  if (score >= 50) return 'average';
  if (score >= 25) return 'poor';
  return 'very_poor';
}

/**
 * Get Thai reputation label
 */
export function getReputationLabel(score: number): string {
  if (score >= 90) return 'ดีเยี่ยม';
  if (score >= 75) return 'ดี';
  if (score >= 50) return 'ปานกลาง';
  if (score >= 25) return 'พอใช้';
  return 'ควรระวัง';
}
