/**
 * SaaS Plan Definitions - Single Source of Truth
 */

export interface PlanLimits {
    maxUsers: number;
    maxTools: number;
    maxCustomers: number;
    maxRentalsPerMonth: number;
    features: {
        inventory: boolean;
        crm: boolean;
        rentals: boolean;
        finance: boolean;
        automation: boolean;
        reports: boolean;
        intelligence: boolean;
        customContract: boolean;
        advancedDashboard: boolean;
        exportData: boolean;
        prioritySupport: boolean;
    };
}

export const PLANS: Record<string, PlanLimits> = {
    free: {
        maxUsers: 2,
        maxTools: 20,
        maxCustomers: 50,
        maxRentalsPerMonth: 10,
        features: {
            inventory: true,
            crm: true,
            rentals: true,
            finance: false,
            automation: false,
            reports: false,
            intelligence: false,
            customContract: false,
            advancedDashboard: false,
            exportData: false,
            prioritySupport: false,
        },
    },
    pro: {
        maxUsers: 10,
        maxTools: 200,
        maxCustomers: 1000,
        maxRentalsPerMonth: 500,
        features: {
            inventory: true,
            crm: true,
            rentals: true,
            finance: true,
            automation: true,
            reports: true,
            intelligence: false,
            customContract: true,
            advancedDashboard: true,
            exportData: true,
            prioritySupport: false,
        },
    },
    premium: {
        maxUsers: 9999, // Unlimited
        maxTools: 9999, // Unlimited
        maxCustomers: 99999, // Unlimited
        maxRentalsPerMonth: 99999, // Unlimited
        features: {
            inventory: true,
            crm: true,
            rentals: true,
            finance: true,
            automation: true,
            reports: true,
            intelligence: true,
            customContract: true,
            advancedDashboard: true,
            exportData: true,
            prioritySupport: true,
        },
    },
};

// Map scale to premium for backward compatibility if needed, 
// but we should eventually migrate "scale" to "premium" in DB.
(PLANS as any).scale = PLANS.premium;

export type PlanType = keyof typeof PLANS;

/**
 * Utility to get plan limits based on tenant plan string
 */
export function getPlanLimits(planName: string | null | undefined): PlanLimits {
    const name = (planName || 'free').toLowerCase();
    return PLANS[name] || PLANS.free;
}
