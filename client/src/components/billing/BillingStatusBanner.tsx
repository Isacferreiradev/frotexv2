'use client';

import React from 'react';
import { useSubscription } from '@/lib/hooks/useSubscription';
import { AlertCircle, Clock, CreditCard, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function BillingStatusBanner() {
    const { subscription, isLoading } = useSubscription();

    if (isLoading || !subscription || subscription.status === 'active' || subscription.plan === 'free') {
        return null;
    }

    const config = {
        trialing: {
            icon: Clock,
            text: `Seu período de teste expira em ${new Date(subscription.trialEndsAt!).toLocaleDateString('pt-BR')}.`,
            action: 'Fazer Upgrade',
            className: 'bg-blue-50 border-blue-100 text-blue-800'
        },
        past_due: {
            icon: CreditCard,
            text: 'Tivemos um problema com seu pagamento e sua assinatura está em atraso.',
            action: 'Regularizar Agora',
            className: 'bg-amber-50 border-amber-200 text-amber-900'
        },
        expired: {
            icon: ShieldAlert,
            text: 'Sua assinatura expirou. Seus recursos foram limitados.',
            action: 'Renovar Assinatura',
            className: 'bg-red-50 border-red-200 text-red-900'
        },
        failed: {
            icon: AlertCircle,
            text: 'Ocorreu uma falha recorrente no seu faturamento.',
            action: 'Ver Detalhes',
            className: 'bg-red-50 border-red-200 text-red-900'
        },
        pending_payment: {
            icon: Clock,
            text: 'Aguardando confirmação do seu pagamento PIX.',
            action: 'Ver QR Code',
            className: 'bg-zinc-50 border-zinc-200 text-zinc-900'
        },
        canceled: {
            icon: AlertCircle,
            text: 'Sua assinatura foi cancelada.',
            action: 'Reativar',
            className: 'bg-zinc-100 border-zinc-200 text-zinc-600'
        },
        unpaid: {
            icon: ShieldAlert,
            text: 'Sua conta está inadimplente. Regularize para evitar bloqueio total.',
            action: 'Pagar Agora',
            className: 'bg-red-100 border-red-200 text-red-950'
        }
    };

    const status = subscription.status as keyof typeof config;
    const item = config[status];

    if (!item) return null;

    const Icon = item.icon;

    return (
        <div className={cn("w-full border-b px-6 py-3 flex items-center justify-between transition-all duration-500", item.className)}>
            <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-white/50 backdrop-blur-sm">
                    <Icon className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold uppercase tracking-tight">
                    {item.text}
                </p>
            </div>

            <Link
                href="/configuracoes?tab=assinatura"
                className="text-[10px] font-extrabold uppercase tracking-widest px-4 py-2 rounded-xl bg-white/80 hover:bg-white transition-all shadow-sm flex items-center gap-2"
            >
                {item.action}
                <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            </Link>
        </div>
    );
}
