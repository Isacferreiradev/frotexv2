import { PLANS, getPlanLimits, PlanLimits } from '../config/plans';

// Re-export from config to avoid breaking existing imports 
// during the transition, but we should refactor them later.
export { PLANS as PLAN_CONFIG, getPlanLimits };
export type { PlanLimits };
export type PlanTier = 'free' | 'pro' | 'scale' | 'premium';
