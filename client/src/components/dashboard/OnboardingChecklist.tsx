import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, ArrowRight, HardHat, Users, Calendar, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

export function OnboardingChecklist() {
    const router = useRouter();
    const user = useAuthStore(s => s.user);

    // If the user is globally flagged as onboarded, we don't even need to fetch.
    const isGloballyOnboarded = user?.hasOnboarded;

    const { data: status, isLoading } = useQuery({
        queryKey: ['onboarding-status'],
        queryFn: async () => (await api.get('/onboarding/status')).data.data,
        enabled: !isGloballyOnboarded,
        staleTime: 0, // Force fresh fetch to prevent ghost sessions
        gcTime: 0,    // Do not keep in memory when unmounted
    });

    if (isGloballyOnboarded || !status || status.hasOnboarded) return null;

    const steps = [
        {
            key: 'toolCreated',
            title: 'Sua primeira ferramenta',
            desc: 'Cadastre um item no inventário.',
            icon: HardHat,
            completed: status.steps.toolCreated
        },
        {
            key: 'customerCreated',
            title: 'Seu primeiro cliente',
            desc: 'Crie um perfil para locação.',
            icon: Users,
            completed: status.steps.customerCreated
        },
        {
            key: 'rentalCreated',
            title: 'Sua primeira locação',
            desc: 'Simule um contrato de aluguel.',
            icon: Calendar,
            completed: status.steps.rentalCreated
        }
    ];

    const progressPercent = (status.progress.completed / status.progress.total) * 100;

    return (
        <Card glass className="border-violet-100 bg-violet-50/10 overflow-hidden relative group shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-violet-500/10 transition-all duration-700" />

            <CardHeader className="pb-4 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                            <CardTitle className="text-sm font-bold text-zinc-900 uppercase tracking-widest font-heading">
                                Configuração Inicial
                            </CardTitle>
                        </div>
                        <p className="text-xs font-medium text-zinc-500">
                            Faltam <span className="text-violet-600 font-bold">{status.progress.total - status.progress.completed} passos</span> para ativar sua locadora em produção.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-violet-100 rounded-full px-4 py-1.5 shrink-0 w-fit shadow-sm">
                        <span className="text-xs font-bold text-violet-600 tracking-widest">{progressPercent.toFixed(0)}%</span>
                        <div className="w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 relative z-10 py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {steps.map((step) => (
                        <div
                            key={step.key}
                            className={cn(
                                "flex items-start gap-4 p-3 rounded-xl border transition-all duration-300 relative overflow-hidden",
                                step.completed
                                    ? "bg-emerald-50/30 border-emerald-100"
                                    : "bg-white border-zinc-100 hover:border-violet-200"
                            )}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                                step.completed ? "bg-emerald-500 text-white shadow-sm" : "bg-zinc-50 text-zinc-400"
                            )}>
                                {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                                <p className={cn("text-xs font-bold truncate tracking-tight mb-1", step.completed ? "text-emerald-700" : "text-zinc-900")}>
                                    {step.title}
                                </p>
                                <p className="text-[10px] md:text-xs font-medium text-zinc-500 truncate leading-relaxed">
                                    {step.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-100">
                    <button
                        onClick={() => router.push('/onboarding')}
                        className="group flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-8 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-violet-200 uppercase tracking-widest"
                    >
                        Continuar Setup <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
}
