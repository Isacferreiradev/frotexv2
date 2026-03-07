'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    CheckCircle2,
    HardHat,
    Users,
    Calendar,
    Loader2,
    Sparkles,
    ChevronRight,
    ArrowLeft,
    Check,
    SkipForward,
    Wrench,
    TrendingUp,
    FileText,
    Bell,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

// ─── Schemas ────────────────────────────────────────────────────────────────

const toolSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    categoryId: z.string().uuid('Categoria obrigatória'),
    dailyRate: z.coerce.number().min(0, 'Valor inválido'),
});

const customerSchema = z.object({
    fullName: z.string().min(2, 'Nome obrigatório'),
    phoneNumber: z.string().min(10, 'Telefone inválido'),
    documentNumber: z.string().min(11, 'Documento inválido'),
});

const rentalSchema = z.object({
    toolId: z.string().uuid(),
    customerId: z.string().uuid(),
    startDate: z.string(),
    endDateExpected: z.string(),
    dailyRateAgreed: z.coerce.number().min(0),
});

type ToolForm = z.infer<typeof toolSchema>;
type CustomerForm = z.infer<typeof customerSchema>;
type RentalForm = z.infer<typeof rentalSchema>;

// ─── Progress Bar ────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
    const steps = [
        { label: 'Boas-vindas', icon: Sparkles },
        { label: 'Ferramenta', icon: Wrench },
        { label: 'Cliente', icon: Users },
        { label: 'Locação', icon: Calendar },
    ];

    return (
        <div className="w-full max-w-xl mx-auto mb-10">
            <div className="flex items-center justify-between relative">
                {/* connector line */}
                <div className="absolute top-4 left-4 right-4 h-0.5 bg-zinc-100 z-0" />
                <div
                    className="absolute top-4 left-4 h-0.5 bg-violet-500 z-0 transition-all duration-700"
                    style={{ width: `${Math.max(0, ((current - 1) / (steps.length - 1)) * 100)}%` }}
                />
                {steps.map((s, i) => {
                    const isDone = current > i + 1;
                    const isActive = current === i + 1;
                    return (
                        <div key={i} className="flex flex-col items-center z-10 gap-1.5">
                            <div className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border-2',
                                isDone ? 'bg-violet-600 border-violet-600 text-white' :
                                    isActive ? 'bg-white border-violet-600 text-violet-600' :
                                        'bg-white border-zinc-200 text-zinc-300'
                            )}>
                                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <s.icon className="w-4 h-4" />}
                            </div>
                            <span className={cn('text-[10px] font-bold hidden sm:block', isActive ? 'text-violet-600' : isDone ? 'text-zinc-500' : 'text-zinc-300')}>
                                {s.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Step Wrapper ─────────────────────────────────────────────────────────────

function StepCard({ children, onNext, onBack, onSkip, nextLabel = 'Próximo', isLoading = false, showBack = true, showSkip = false }: any) {
    return (
        <div className="w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
                {children}
                <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t border-zinc-50">
                    {showBack ? (
                        <button type="button" onClick={onBack} className="text-sm font-semibold text-zinc-400 hover:text-zinc-700 transition-colors flex items-center gap-1.5">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </button>
                    ) : <div />}

                    <div className="flex items-center gap-3">
                        {showSkip && (
                            <button type="button" onClick={onSkip} className="text-sm font-semibold text-zinc-400 hover:text-zinc-600 transition-colors flex items-center gap-1.5">
                                Pular <SkipForward className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button onClick={onNext} disabled={isLoading} className="btn-primary px-8 h-11">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>{nextLabel} <ChevronRight className="w-4 h-4 ml-1" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const updateUser = useAuthStore((s) => s.updateUser);

    const [step, setStep] = useState(1);
    const [createdTool, setCreatedTool] = useState<any>(null);
    const [createdCustomer, setCreatedCustomer] = useState<any>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [hasSynced, setHasSynced] = useState(false);

    // Queries
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/tool-categories')).data.data
    });

    const { data: onboardingStatus } = useQuery({
        queryKey: ['onboarding-status'],
        queryFn: async () => (await api.get('/onboarding/status')).data.data
    });

    // Redirect immediately if already onboarded — no step 5 flash
    useEffect(() => {
        if (!hasSynced && onboardingStatus) {
            if (onboardingStatus.hasOnboarded) {
                router.replace('/dashboard');
                return;
            }
            // Restore from where they left off, but cap at step 4 max
            const savedStep = Math.min(onboardingStatus.onboardingStep || 1, 4);
            setStep(savedStep);
            setHasSynced(true);
        }
    }, [onboardingStatus, hasSynced, router]);

    // Forms
    const toolForm = useForm<ToolForm>({
        resolver: zodResolver(toolSchema) as any,
        defaultValues: { dailyRate: '' as any }
    });
    const customerForm = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) as any });
    const rentalForm = useForm<RentalForm>({
        resolver: zodResolver(rentalSchema) as any,
        defaultValues: {
            startDate: new Date().toISOString().split('T')[0],
            endDateExpected: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
        }
    });

    useEffect(() => {
        if (createdTool) rentalForm.setValue('toolId', createdTool.id);
        if (createdCustomer) rentalForm.setValue('customerId', createdCustomer.id);
        if (createdTool?.dailyRate) rentalForm.setValue('dailyRateAgreed', parseFloat(createdTool.dailyRate));
    }, [createdTool, createdCustomer, rentalForm]);

    // Mutations
    const updateStep = useMutation({
        mutationFn: async (newStep: number) => await api.patch('/onboarding/step', { step: newStep })
    });

    const createTool = useMutation({
        mutationFn: async (data: ToolForm) => (await api.post('/tools', data)).data.data,
        onSuccess: (tool: any) => {
            setCreatedTool(tool);
            updateStep.mutate(3);
            setStep(3);
            toast.success('Ferramenta cadastrada!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao cadastrar ferramenta')
    });

    const createCustomer = useMutation({
        mutationFn: async (data: CustomerForm) => (await api.post('/customers', data)).data.data,
        onSuccess: (customer: any) => {
            setCreatedCustomer(customer);
            updateStep.mutate(4);
            setStep(4);
            toast.success('Cliente cadastrado!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao cadastrar cliente')
    });

    const createRental = useMutation({
        mutationFn: async (data: RentalForm) => (await api.post('/rentals', data)).data.data,
        onSuccess: () => {
            toast.success('Locação criada!');
            finishOnboarding();
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao criar locação')
    });

    const completeOnboarding = useMutation({
        mutationFn: async () => await api.post('/onboarding/finish'),
    });

    // Complete onboarding and redirect — never show step 5
    const finishOnboarding = async () => {
        try {
            await completeOnboarding.mutateAsync();
        } catch { }
        updateUser({ hasOnboarded: true });
        toast.success('🎉 Bem-vindo ao Locattus!', { description: 'Sua locadora está pronta.' });
        router.replace('/dashboard');
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-violet-50/30 py-12 px-6 flex flex-col items-center">

            {/* Logo */}
            <div className="mb-10 flex items-center gap-2.5">
                <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-lg shadow-violet-500/20">L</div>
                <span className="font-bold text-xl text-zinc-900 tracking-tight">Locattus</span>
            </div>

            {/* Progress — only show on steps 2-4 */}
            {step >= 2 && step <= 4 && <ProgressBar current={step} total={4} />}

            {/* ── Step 1: Welcome ── */}
            {step === 1 && (
                <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                            <Sparkles className="w-9 h-9" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight font-heading">Bem-vindo ao Locattus!</h1>
                        <p className="text-zinc-500 text-base max-w-sm mx-auto">
                            Vamos configurar sua locadora em 3 passos rápidos para você começar a faturar hoje.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-left max-w-sm mx-auto">
                        {[
                            { icon: HardHat, label: 'Cadastre sua primeira ferramenta', color: 'bg-blue-50 text-blue-500' },
                            { icon: Users, label: 'Adicione seu primeiro cliente', color: 'bg-emerald-50 text-emerald-500' },
                            { icon: Calendar, label: 'Crie sua primeira locação', color: 'bg-violet-50 text-violet-500' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-200 transition-all">
                                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-700">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => { updateStep.mutate(2); setStep(2); }}
                            className="btn-primary w-full max-w-xs h-12 mx-auto flex items-center justify-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            Começar configuração
                        </button>
                        <p className="text-zinc-400 text-xs">⏱ Leva menos de 3 minutos</p>
                    </div>
                </div>
            )}

            {/* ── Step 2: Tool ── */}
            {step === 2 && (
                <StepCard
                    onNext={toolForm.handleSubmit((data: any) => createTool.mutate(data))}
                    onBack={() => setStep(1)}
                    isLoading={createTool.isPending}
                    nextLabel="Salvar Ferramenta"
                    showBack
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <HardHat className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Sua primeira ferramenta</h2>
                            <p className="text-sm text-zinc-400">Cadastre um equipamento do seu estoque</p>
                        </div>
                    </div>

                    <form className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="label">Nome do Equipamento</label>
                            <input {...toolForm.register('name')} placeholder="Ex: Furadeira Bosch, Andaime..." className="input-field" />
                            {toolForm.formState.errors.name && <p className="text-xs text-red-500">{toolForm.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">Categoria</label>
                            {!isCreatingCategory ? (
                                <div className="space-y-2">
                                    <select
                                        {...toolForm.register('categoryId')}
                                        onChange={(e) => {
                                            if (e.target.value === 'ADD_NEW') {
                                                setIsCreatingCategory(true);
                                                toolForm.setValue('categoryId', '');
                                            } else {
                                                toolForm.setValue('categoryId', e.target.value);
                                            }
                                        }}
                                        className="input-field cursor-pointer"
                                    >
                                        <option value="">Selecione a categoria</option>
                                        <option value="ADD_NEW" className="font-bold text-violet-600">➕ Criar nova categoria</option>
                                        {categories?.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {toolForm.formState.errors.categoryId && <p className="text-xs text-red-500">{toolForm.formState.errors.categoryId.message}</p>}
                                </div>
                            ) : (
                                <div className="flex gap-2 animate-in slide-in-from-top-2">
                                    <input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Nome da nova categoria"
                                        className="input-field flex-1"
                                        autoFocus
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter' && newCategoryName.trim()) {
                                                try {
                                                    const res = await api.post('/tool-categories', { name: newCategoryName });
                                                    const newCat = res.data.data;
                                                    await queryClient.invalidateQueries({ queryKey: ['categories'] });
                                                    toolForm.setValue('categoryId', newCat.id);
                                                    setIsCreatingCategory(false);
                                                    setNewCategoryName('');
                                                    toast.success('Categoria criada!');
                                                } catch { toast.error('Erro ao criar categoria'); }
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newCategoryName.trim()) return;
                                            try {
                                                const res = await api.post('/tool-categories', { name: newCategoryName });
                                                const newCat = res.data.data;
                                                await queryClient.invalidateQueries({ queryKey: ['categories'] });
                                                toolForm.setValue('categoryId', newCat.id);
                                                setIsCreatingCategory(false);
                                                setNewCategoryName('');
                                                toast.success('Categoria criada!');
                                            } catch { toast.error('Erro ao criar categoria'); }
                                        }}
                                        disabled={!newCategoryName.trim()}
                                        className="btn-primary px-4 w-auto disabled:opacity-50"
                                    >
                                        Salvar
                                    </button>
                                    <button type="button" onClick={() => setIsCreatingCategory(false)} className="px-3 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-colors w-auto">✕</button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">Valor da diária (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm pointer-events-none">R$</span>
                                <input type="number" step="0.01" {...toolForm.register('dailyRate')} className="input-field pl-12" placeholder="0,00" />
                            </div>
                            {toolForm.formState.errors.dailyRate && <p className="text-xs text-red-500">{toolForm.formState.errors.dailyRate.message}</p>}
                        </div>
                    </form>
                </StepCard>
            )}

            {/* ── Step 3: Customer ── */}
            {step === 3 && (
                <StepCard
                    onNext={customerForm.handleSubmit((data) => createCustomer.mutate(data))}
                    onBack={() => setStep(2)}
                    isLoading={createCustomer.isPending}
                    nextLabel="Salvar Cliente"
                    showBack
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Seu primeiro cliente</h2>
                            <p className="text-sm text-zinc-400">Para contratos e histórico de pagamentos</p>
                        </div>
                    </div>

                    <form className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="label">Nome Completo</label>
                            <input {...customerForm.register('fullName')} placeholder="Ex: José da Silva" className="input-field" />
                            {customerForm.formState.errors.fullName && <p className="text-xs text-red-500">{customerForm.formState.errors.fullName.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">WhatsApp / Telefone</label>
                            <input {...customerForm.register('phoneNumber')} placeholder="(11) 99999-9999" className="input-field" />
                            {customerForm.formState.errors.phoneNumber && <p className="text-xs text-red-500">{customerForm.formState.errors.phoneNumber.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="label">CPF ou CNPJ</label>
                            <input {...customerForm.register('documentNumber')} placeholder="000.000.000-00" className="input-field" />
                            {customerForm.formState.errors.documentNumber && <p className="text-xs text-red-500">{customerForm.formState.errors.documentNumber.message}</p>}
                        </div>
                    </form>
                </StepCard>
            )}

            {/* ── Step 4: Rental ── */}
            {step === 4 && (
                <StepCard
                    onNext={rentalForm.handleSubmit((data: any) => createRental.mutate(data))}
                    onBack={() => setStep(3)}
                    isLoading={createRental.isPending}
                    nextLabel="Criar Locação"
                    showBack
                    showSkip
                    onSkip={finishOnboarding}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900">Primeira locação</h2>
                            <p className="text-sm text-zinc-400">Veja o fluxo completo funcionando</p>
                        </div>
                    </div>

                    {/* Summary cards */}
                    {(createdTool || createdCustomer) && (
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            {createdTool && (
                                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-0.5">Ferramenta</p>
                                    <p className="text-sm font-bold text-blue-900 truncate">{createdTool.name}</p>
                                </div>
                            )}
                            {createdCustomer && (
                                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">Cliente</p>
                                    <p className="text-sm font-bold text-emerald-900 truncate">{createdCustomer.fullName}</p>
                                </div>
                            )}
                        </div>
                    )}

                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="label">Início</label>
                                <input type="date" {...rentalForm.register('startDate')} className="input-field" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="label">Devolução Prevista</label>
                                <input type="date" {...rentalForm.register('endDateExpected')} className="input-field" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">Valor da diária (R$)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm pointer-events-none">R$</span>
                                <input type="number" step="0.01" {...rentalForm.register('dailyRateAgreed')} className="input-field pl-12" placeholder="0,00" />
                            </div>
                        </div>
                    </form>
                </StepCard>
            )}

        </div>
    );
}
