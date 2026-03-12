'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// -------------------------------------------------------
// Types mirrored from the backend SubscriptionState
// -------------------------------------------------------

export interface UsageItem {
    used: number;
    limit: number;
    pct: number;
}

export interface SubscriptionFeatures {
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
}

export interface SubscriptionState {
    plan: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'paused' | 'expired' | 'failed' | 'pending_payment';
    isTrial: boolean;
    trialEndsAt: string | null;
    subscriptionEndsAt: string | null;
    isLocked: boolean;
    lockReason: string | null;
    features: SubscriptionFeatures;
    limits: {
        maxUsers: number;
        maxTools: number;
        maxCustomers: number;
        maxRentalsPerMonth: number;
    };
    usage: {
        tools: UsageItem;
        customers: UsageItem;
        users: UsageItem;
        rentalsThisMonth: UsageItem;
    };
    needsUpgrade: boolean;
    blockedResources: string[];
}

// -------------------------------------------------------
// Hook
// -------------------------------------------------------

export function useSubscription() {
    const { data, isLoading, error, refetch } = useQuery<SubscriptionState>({
        queryKey: ['subscription'],
        queryFn: async () => {
            const res = await api.get('/tenant/subscription');
            return res.data.data as SubscriptionState;
        },
        staleTime: 1000 * 60 * 3, // 3 min – re-check after actions
        retry: false,
    });

    /**
     * Returns true if the tenant has access to the given feature.
     */
    function canUse(feature: keyof SubscriptionFeatures): boolean {
        if (!data) return false;
        if (data.isLocked) return false;
        return data.features[feature] === true;
    }

    /**
     * Returns true if the given resource is at or above its limit.
     */
    function isAtLimit(resource: keyof SubscriptionState['usage']): boolean {
        if (!data) return false;
        if (data.isLocked) return true;
        return data.blockedResources.includes(resource.replace('ThisMonth', ''));
    }

    /**
     * Returns a human-readable plan label.
     */
    function planLabel(): string {
        const map: Record<string, string> = { free: 'Free', pro: 'Pro', premium: 'Premium', scale: 'Premium' };
        return map[data?.plan ?? 'free'] ?? 'Free';
    }

    return { subscription: data, isLoading, error, canUse, isAtLimit, planLabel, refetch };
}
