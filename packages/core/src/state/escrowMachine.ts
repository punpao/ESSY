import { DealStatus } from '../types';

export interface EscrowTransition {
  from: DealStatus;
  to: DealStatus;
  action: string;
  guard?: (context: EscrowContext) => boolean;
}

export interface EscrowContext {
  status: DealStatus;
  buyer_id?: string;
  tracking_number?: string;
  delivered_at?: Date;
  auto_release_at?: Date;
  has_open_dispute?: boolean;
}

/**
 * Escrow State Machine Transitions
 * 
 * States: PENDING → HOLD → SHIPPED → RELEASED
 * Branches: ... → DISPUTE → (REFUND | RELEASED)
 */
const transitions: EscrowTransition[] = [
  // PENDING -> HOLD (when payment received)
  {
    from: 'PENDING',
    to: 'HOLD',
    action: 'payment_received',
    guard: (ctx) => !!ctx.buyer_id,
  },

  // HOLD -> SHIPPED (when seller adds tracking)
  {
    from: 'HOLD',
    to: 'SHIPPED',
    action: 'add_tracking',
    guard: (ctx) => !!ctx.tracking_number,
  },

  // SHIPPED -> RELEASED (buyer confirms OR auto-release)
  {
    from: 'SHIPPED',
    to: 'RELEASED',
    action: 'confirm_received',
  },
  {
    from: 'SHIPPED',
    to: 'RELEASED',
    action: 'auto_release',
    guard: (ctx) => {
      if (ctx.auto_release_at && !ctx.has_open_dispute) {
        return new Date() >= ctx.auto_release_at;
      }
      return false;
    },
  },

  // HOLD -> DISPUTE (buyer opens dispute before shipping)
  {
    from: 'HOLD',
    to: 'DISPUTE',
    action: 'open_dispute',
  },

  // SHIPPED -> DISPUTE (buyer opens dispute after shipping)
  {
    from: 'SHIPPED',
    to: 'DISPUTE',
    action: 'open_dispute',
  },

  // DISPUTE -> REFUND (admin resolves with refund)
  {
    from: 'DISPUTE',
    to: 'REFUND',
    action: 'resolve_refund',
  },

  // DISPUTE -> RELEASED (admin resolves with release)
  {
    from: 'DISPUTE',
    to: 'RELEASED',
    action: 'resolve_release',
  },

  // PENDING -> REFUND (cancel before payment, rare edge case)
  {
    from: 'PENDING',
    to: 'REFUND',
    action: 'cancel',
  },
];

export class EscrowStateMachine {
  private transitions: Map<string, EscrowTransition[]>;

  constructor() {
    this.transitions = new Map();
    
    // Index transitions by "from" state for quick lookup
    transitions.forEach((t) => {
      const key = t.from;
      if (!this.transitions.has(key)) {
        this.transitions.set(key, []);
      }
      this.transitions.get(key)!.push(t);
    });
  }

  /**
   * Check if a transition is valid
   */
  canTransition(context: EscrowContext, action: string): boolean {
    const possible = this.transitions.get(context.status) || [];
    const match = possible.find((t) => t.action === action);
    
    if (!match) return false;
    if (match.guard && !match.guard(context)) return false;
    
    return true;
  }

  /**
   * Execute a transition and return the new state
   */
  transition(context: EscrowContext, action: string): DealStatus {
    if (!this.canTransition(context, action)) {
      throw new Error(
        `Invalid transition: ${context.status} -> ${action}. Current context: ${JSON.stringify(context)}`
      );
    }

    const possible = this.transitions.get(context.status) || [];
    const match = possible.find((t) => t.action === action);
    
    return match!.to;
  }

  /**
   * Get all valid actions for the current state
   */
  getValidActions(context: EscrowContext): string[] {
    const possible = this.transitions.get(context.status) || [];
    return possible
      .filter((t) => !t.guard || t.guard(context))
      .map((t) => t.action);
  }

  /**
   * Check if auto-release should trigger
   */
  shouldAutoRelease(context: EscrowContext): boolean {
    return this.canTransition(context, 'auto_release');
  }
}

// Singleton instance
export const escrowMachine = new EscrowStateMachine();
