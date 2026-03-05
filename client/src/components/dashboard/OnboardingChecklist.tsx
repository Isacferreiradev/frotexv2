'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, Circle, ArrowRight, HardHat, Users, Calendar } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function OnboardingChecklist() {
    const { data: status, isLoading } = useQuery({
        queryKey: ['onboarding-status'],
        queryFn: async () => (await api.get('/onboarding/status')).data.data,
    });

    if (isLoading || !status || status.hasOnboarded) return null;

    const steps = [
        {
            key: 'toolCreated',
            title: 'Sua primeira ferramenta',
            desc: 'Cadastre um item para começar.',
            icon: HardHat,
            completed: status.steps.toolCreated
        },
        {
            key: 'customerCreated',
            title: 'Seu primeiro cliente',
            desc: 'Dados para contratos e histórico.',
            icon: Users,
            completed: status.steps.customerCreated
        },
        {
            key: 'rentalCreated',
            title: 'Sua primeira locação',
            desc: 'Simule um aluguel completo.',
            icon: Calendar,
            completed: status.steps.rentalCreated
        }
    ];

    const progressPercent = (status.progress.completed / status.progress.total) * 100;

    return (
        <Card glass className="border-violet-100 bg-violet-50/10 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/10 transition-all duration-700" />

            <CardHeader className="pb-4">
                <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-bold text-zinc-900 font-heading">Complete sua configuração</CardTitle>
                        <p className="text-xs text-zinc-500">Existem {status.progress.total - status.progress.completed} passos pendentes para ativar sua locadora.</p>
                    </div>
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2.5 py-1 rounded-full">{status.progress.completed}/{status.progress.total}</span>
                </div>
            </CardHeader>

            <CardContent className="space-y-4 relative z-10">
                <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-violet-500 transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {steps.map((step) => (
                        <div
                            key={step.key}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                                step.completed
                                    ? "bg-emerald-50/30 border-emerald-100"
                                    : "bg-white border-zinc-100 hover:border-violet-200"
                            )}
                        >
                            <div className={cn(
                                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                                step.completed ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                            )}>
                                {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0">
                                <p className={cn("text-xs font-bold truncate", step.completed ? "text-emerald-700" : "text-zinc-900")}>
                                    {step.title}
                                </p>
                                <p className="text-[10px] text-zinc-500 truncate">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-2">
                    <Link
                        href="/onboarding"
                        className="btn-primary w-full md:w-auto h-9 text-xs px-6 inline-flex"
                    >
                        Continuar Onboarding <ArrowRight className="ml-2 w-3.5 h-3.5" />
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
