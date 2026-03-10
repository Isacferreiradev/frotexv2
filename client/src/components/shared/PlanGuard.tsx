'use client';

import React from 'react';
import { useSubscription, SubscriptionFeatures } from '@/lib/hooks/useSubscription';

interface PlanGuardProps {
    /** The feature flag to check */
    feature: keyof SubscriptionFeatures;
    /** What to show when the feature is locked */
    fallback?: React.ReactNode;
    /** Content to render when user has access */
    children: React.ReactNode;
}

/**
 * Wraps UI that should only be visible to tenants with adequate plan features.
 *
 * Usage:
 * ```tsx
 * <PlanGuard feature="intelligence" fallback={<UpgradeBanner />}>
 *   <AdvancedAnalytics />
 * </PlanGuard>
 * ```
 */
export function PlanGuard({ feature, children, fallback }: PlanGuardProps) {
    const { canUse, isLoading } = useSubscription();

    if (isLoading) return null;

    if (!canUse(feature)) {
        return fallback ? <>{fallback}</> : <LockedFeaturePlaceholder />;
    }

    return <>{children}</>;
}

// -------------------------------------------------------
// Default locked-feature placeholder
// -------------------------------------------------------

function LockedFeaturePlaceholder() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-8 text-center">
            <span className="text-3xl">🔒</span>
            <p className="text-sm font-semibold text-foreground">Recurso Premium</p>
            <p className="text-xs text-muted-foreground">
                Faça upgrade do seu plano para liberar esta funcionalidade.
            </p>
            <a
                href="/settings/billing"
                className="mt-2 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
                Ver planos
            </a>
        </div>
    );
}
