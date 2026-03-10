'use client';

import React from 'react';
import { useSubscription, UsageItem } from '@/lib/hooks/useSubscription';

// -------------------------------------------------------
// Usage Widget Component
// -------------------------------------------------------

export function UsageDashboardWidget() {
    const { subscription, isLoading, planLabel } = useSubscription();

    if (isLoading || !subscription) return <UsageWidgetSkeleton />;

    const { usage, isLocked, status } = subscription;

    return (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plano atual</p>
                    <p className="text-lg font-bold text-foreground">{planLabel()}</p>
                </div>
                {isLocked ? (
                    <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                        Conta bloqueada
                    </span>
                ) : (
                    <StatusBadge status={status} />
                )}
            </div>

            <div className="space-y-3">
                <UsageBar label="Equipamentos" item={usage.tools} icon="🔧" />
                <UsageBar label="Clientes" item={usage.customers} icon="👥" />
                <UsageBar label="Usuários" item={usage.users} icon="👤" />
                <UsageBar label="Locações (mês)" item={usage.rentalsThisMonth} icon="📋" />
            </div>

            {subscription.needsUpgrade && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                    ⚠️ Você atingiu o limite de um ou mais recursos.{' '}
                    <a href="/settings/billing" className="font-semibold underline">
                        Fazer upgrade
                    </a>
                </div>
            )}
        </div>
    );
}

// -------------------------------------------------------
// Sub-components
// -------------------------------------------------------

function UsageBar({ label, item, icon }: { label: string; item: UsageItem; icon: string }) {
    const isUnlimited = item.limit >= 9999;
    const pct = isUnlimited ? 0 : item.pct;
    const isWarning = pct >= 80 && pct < 100;
    const isMaxed = pct >= 100;

    const barColor = isMaxed
        ? 'bg-destructive'
        : isWarning
            ? 'bg-amber-500'
            : 'bg-primary';

    return (
        <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    {icon} {label}
                </span>
                <span className={`font-semibold ${isMaxed ? 'text-destructive' : 'text-foreground'}`}>
                    {isUnlimited ? `${item.used} / ∞` : `${item.used} / ${item.limit}`}
                </span>
            </div>
            {!isUnlimited && (
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                </div>
            )}
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; cls: string }> = {
        active: { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700' },
        trialing: { label: 'Trial', cls: 'bg-blue-100 text-blue-700' },
        past_due: { label: 'Em atraso', cls: 'bg-orange-100 text-orange-700' },
        canceled: { label: 'Cancelado', cls: 'bg-red-100 text-red-700' },
        unpaid: { label: 'Inadimplente', cls: 'bg-red-100 text-red-700' },
        paused: { label: 'Pausado', cls: 'bg-gray-100 text-gray-600' },
    };
    const badge = map[status] ?? { label: status, cls: 'bg-muted text-muted-foreground' };
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.cls}`}>
            {badge.label}
        </span>
    );
}

function UsageWidgetSkeleton() {
    return (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 animate-pulse">
            <div className="h-5 w-1/3 rounded bg-muted" />
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-1">
                    <div className="h-3 w-full rounded bg-muted" />
                    <div className="h-1.5 w-full rounded-full bg-muted" />
                </div>
            ))}
        </div>
    );
}
