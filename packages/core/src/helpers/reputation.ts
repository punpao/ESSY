import { ReputationEventType } from '../types';

export interface ReputationEvent {
  type: ReputationEventType;
  weight: number;
}

/**
 * Calculate seller reputation score using sigmoid function
 * score = sigmoid(#released * 0.3 - #disputes * 1.0)
 * Returns a value between 0 and 100
 */
export function calculateReputationScore(events: ReputationEvent[]): number {
  let weightedSum = 0;
  
  for (const event of events) {
    weightedSum += event.weight;
  }

  // Sigmoid function: 1 / (1 + e^(-x))
  const sigmoid = 1 / (1 + Math.exp(-weightedSum));
  
  // Scale to 0-100
  return Math.round(sigmoid * 100);
}

/**
 * Generate reputation event weights based on deal outcome
 */
export function getReputationWeight(eventType: ReputationEventType): number {
  switch (eventType) {
    case 'positive':
      return 0.3;
    case 'neutral':
      return 0;
    case 'negative':
      return -1.0;
    default:
      return 0;
  }
}
