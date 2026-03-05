'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import api from '@/lib/api';
import { Rocket, CheckCircle2, LayoutDashboard, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';

const steps = [
    {
        title: "Bem-vindo ao FROTEX",
        description: "O sistema operacional da sua locadora. Vamos configurar seu cockpit para máxima lucratividade.",
        icon: Rocket,
        color: "text-violet-600",
        bg: "bg-violet-50"
    },
    {
        title: "Sua Frota Sob Controle",
        description: "Catalogue seus itens, defina diárias e acompanhe o estado de manutenção em tempo real.",
        icon: Wrench,
        color: "text-indigo-600",
        bg: "bg-indigo-50"
    },
    {
        title: "Gestão Inteligente",
        description: "Controle locações, faturamento e receba insights sobre o ROI de cada equipamento.",
        icon: LayoutDashboard,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        title: "Segurança Avançada",
        description: "Seus dados estão protegidos com criptografia de ponta e infraestrutura resiliente.",
        icon: ShieldCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    }
];

export function OnboardingTour() {
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const [open, setOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (user && user.hasOnboarded === false) {
            setOpen(true);
        }
    }, [user]);

    const handleFinish = async () => {
        try {
            await api.put('/auth/profile', { hasOnboarded: true });
            updateUser({ hasOnboarded: true });
            setOpen(false);
        } catch {
            setOpen(false);
        }
    };

    const nextStep = () => {
        if (animating) return;
        if (currentStep < steps.length - 1) {
            setAnimating(true);
            setTimeout(() => {
                setCurrentStep((s) => s + 1);
                setAnimating(false);
            }, 200);
        } else {
            handleFinish();
        }
    };

    if (!user || user.hasOnboarded) return null;

    const ActiveStep = steps[currentStep];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[480px] p-0 rounded-[40px] border-none shadow-2xl overflow-hidden bg-white/90 backdrop-blur-xl">
                <div className="relative p-10 space-y-8">
                    {/* Progress dots */}
                    <div className="flex gap-2 justify-center">
                        {steps.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? 'w-8 bg-violet-600' : 'w-2 bg-zinc-100'}`}
                            />
                        ))}
                    </div>

                    <div
                        className={`text-center space-y-6 transition-all duration-200 ${animating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
                    >
                        <div className={`w-24 h-24 ${ActiveStep.bg} rounded-[32px] flex items-center justify-center mx-auto shadow-xl shadow-zinc-100`}>
                            <ActiveStep.icon className={`w-12 h-12 ${ActiveStep.color}`} />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{ActiveStep.title}</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed max-w-[280px] mx-auto font-medium">
                                {ActiveStep.description}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={nextStep}
                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-5 rounded-3xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-zinc-200 group"
                    >
                        {currentStep === steps.length - 1 ? (
                            <>
                                Começar Agora
                                <CheckCircle2 className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                Próximo Passo
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <p className="text-[10px] text-zinc-400 text-center font-bold uppercase tracking-widest">
                        O futuro da locação começa aqui
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
