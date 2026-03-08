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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Schemas ────────────────────────────────────────────────────────────────

const toolSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    categoryId: z.string().min(1, 'Categoria obrigatória'),
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
        <div className="w-full max-w-xl mx-auto mb-12">
            <div className="flex items-center justify-between relative">
                {/* connector line */}
                <div className="absolute top-5 left-5 right-5 h-[2px] bg-zinc-100 z-0" />
                <div
                    className="absolute top-5 left-5 h-[2px] bg-violet-600 z-0 transition-all duration-1000 shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                    style={{ width: `${Math.max(0, ((current - 1) / (steps.length - 1)) * 100)}%` }}
                />
                {steps.map((s, i) => {
                    const isDone = current > i + 1;
                    const isActive = current === i + 1;
                    return (
                        <div key={i} className="flex flex-col items-center z-10 gap-2 group">
                            <div className={cn(
                                'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 relative overflow-hidden',
                                isDone ? 'bg-violet-600 border-violet-600 text-white shadow-md' :
                                    isActive ? 'bg-white border-violet-600 text-violet-600 shadow-sm' :
                                        'bg-white border-zinc-200 text-zinc-400'
                            )}>
                                {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : <s.icon className="w-5 h-5" />}
                            </div>
                            <span className={cn(
                                'text-[8.5px] sm:text-[10px] font-extrabold uppercase tracking-widest transition-colors mt-2 text-center truncate max-w-[60px] sm:max-w-none',
                                isActive ? 'text-violet-600' : isDone ? 'text-zinc-600' : 'text-zinc-400 opacity-0 sm:opacity-100'
                            )}>
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
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex items-center justify-center p-4"
        >
            <div className="w-full max-w-xl bg-white border border-violet-100 rounded-[2.5rem] p-8 sm:p-12 shadow-[0_20px_50px_rgba(124,58,237,0.08)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    {children}
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 mt-10 pt-8 border-t border-violet-50 relative z-10">
                    {showBack ? (
                        <button type="button" onClick={onBack} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-violet-600 transition-colors flex items-center gap-2 py-3">
                            <ArrowLeft className="w-4 h-4" /> Voltar
                        </button>
                    ) : <div className="hidden sm:block" />}

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                        {showSkip && (
                            <button type="button" onClick={onSkip} className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-violet-600 transition-colors flex items-center gap-2 py-3">
                                Pular <SkipForward className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white px-8 py-4 rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all shadow-lg shadow-violet-200 hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>{nextLabel} <ChevronRight className="w-4 h-4 ml-1" /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const updateUser = useAuthStore((s) => s.updateUser);
    const user = useAuthStore(s => s.user);

    const [step, setStep] = useState(1);
    const [createdTool, setCreatedTool] = useState<any>(null);
    const [createdCustomer, setCreatedCustomer] = useState<any>(null);
    const [hasSynced, setHasSynced] = useState(false);
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [localCategories, setLocalCategories] = useState<any[]>([]);

    // Queries
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/tool-categories')).data.data
    });

    useEffect(() => {
        if (categories) {
            setLocalCategories(categories);
        }
    }, [categories]);

    const { data: onboardingStatus, isLoading: statusLoading } = useQuery({
        queryKey: ['onboarding-status'],
        queryFn: async () => (await api.get('/onboarding/status')).data.data,
        staleTime: 0,
        gcTime: 0,
    });

    // Guard: Violent Redirect if already onboarded to prevent ghost renders
    useEffect(() => {
        if (user?.hasOnboarded || onboardingStatus?.hasOnboarded) {
            window.location.href = '/dashboard';
        }
    }, [user, onboardingStatus]);

    // Restore step state
    useEffect(() => {
        if (!hasSynced && onboardingStatus && !onboardingStatus.hasOnboarded) {
            const savedStep = Math.min(onboardingStatus.onboardingStep || 1, 4);
            setStep(savedStep);
            setHasSynced(true);
        }
    }, [onboardingStatus, hasSynced]);

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

    const handleCreateToolWithCategory = async (data: ToolForm) => {
        try {
            let finalCategoryId = data.categoryId;

            // Se o usuário selecionou criar nova, criamos a categoria primeiro
            if (finalCategoryId === 'new' && newCategoryName.trim()) {
                const catResponse = await api.post('/tool-categories', {
                    name: newCategoryName.trim(),
                    description: 'Categoria criada no onboarding'
                });
                finalCategoryId = catResponse.data.data.id;

                // Atualiza local state para não perder a referência
                setLocalCategories(prev => [...prev, catResponse.data.data]);
                toolForm.setValue('categoryId', finalCategoryId);
            } else if (finalCategoryId === 'new' && !newCategoryName.trim()) {
                toast.error('Informe o nome da nova categoria.');
                return;
            }

            // Agora cria a ferramenta com o categoryId real
            const toolData = { ...data, categoryId: finalCategoryId };
            createTool.mutate(toolData);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Erro ao criar categoria.');
        }
    };

    const createTool = useMutation({
        mutationFn: async (data: ToolForm) => (await api.post('/tools', data)).data.data,
        onSuccess: (tool: any) => {
            setCreatedTool(tool);
            updateStep.mutate(3);
            setStep(3);
            toast.success('Ferramenta cadastrada!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao cadastrar')
    });

    const createCustomer = useMutation({
        mutationFn: async (data: CustomerForm) => (await api.post('/customers', data)).data.data,
        onSuccess: (customer: any) => {
            setCreatedCustomer(customer);
            updateStep.mutate(4);
            setStep(4);
            // Pre-fill rental rate if tool already created
            if (createdTool?.dailyRate) {
                rentalForm.setValue('dailyRateAgreed', parseFloat(createdTool.dailyRate));
            }
            toast.success('Cliente cadastrado!');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao cadastrar')
    });

    const createRental = useMutation({
        mutationFn: async (data: RentalForm) => (await api.post('/rentals', data)).data.data,
        onSuccess: () => {
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
        // Force hard reload to flush client router cache
        window.location.href = '/dashboard';
    };

    const handleFinalStep = () => {
        if (createdTool?.id && createdCustomer?.id) {
            rentalForm.handleSubmit(
                (d) => createRental.mutate(d),
                (errors) => {
                    console.log('Rental form errors:', errors);
                    toast.error('Preencha os dados da locação corretamente.');
                }
            )();
        } else {
            finishOnboarding();
        }
    };

    if (statusLoading || user?.hasOnboarded) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 font-inter overflow-hidden relative selection:bg-violet-100 selection:text-violet-900">
            <div className="w-full max-w-2xl relative z-10 flex flex-col items-center justify-center min-h-[600px]">
                <ProgressBar current={step} total={4} />

                <AnimatePresence mode="wait">

                    {/* ─── STEP 1: WELCOME */}
                    {step === 1 && (
                        <StepCard
                            onNext={() => { updateStep.mutate(2); setStep(2); }}
                            showBack={false}
                            nextLabel="Iniciar Configuração"
                        >
                            <div className="text-center space-y-6">
                                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                    <Sparkles className="w-10 h-10 text-violet-600" />
                                    <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight font-outfit leading-tight">
                                    Bem-vindo ao seu <br />
                                    <span className="text-violet-600 italic">Cockpit de Gestão.</span>
                                </h2>
                                <p className="text-zinc-500 font-medium max-w-md mx-auto text-sm sm:text-base leading-relaxed">
                                    Vamos preparar seu ambiente em 3 passos rápidos: criar uma ferramenta, adicionar um cliente e simular a sua primeira locação.
                                </p>
                            </div>
                        </StepCard>
                    )}

                    {/* ─── STEP 2: TOOL */}
                    {step === 2 && (
                        <StepCard
                            onNext={toolForm.handleSubmit(handleCreateToolWithCategory)}
                            onBack={() => setStep(1)}
                            onSkip={() => { updateStep.mutate(3); setStep(3); }}
                            showSkip={true}
                            isLoading={createTool.isPending}
                        >
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight font-outfit">Primeira Ferramenta</h2>
                                    <p className="text-zinc-500 text-sm mt-2">O que você costuma alugar com mais frequência?</p>
                                </div>

                                <form className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Nome do Equipamento</label>
                                        <input
                                            {...toolForm.register('name')}
                                            placeholder="Ex: Betoneira 400L CSM"
                                            className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium"
                                        />
                                        {toolForm.formState.errors.name && <p className="text-xs text-red-500 font-medium">{toolForm.formState.errors.name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Categoria</label>
                                        <div className="space-y-3">
                                            <select
                                                {...toolForm.register('categoryId')}
                                                onChange={(e) => {
                                                    toolForm.setValue('categoryId', e.target.value);
                                                    setIsCreatingCategory(e.target.value === 'new');
                                                }}
                                                className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium appearance-none"
                                            >
                                                <option value="" className="text-zinc-500">Selecione uma categoria...</option>
                                                <option value="new" className="text-violet-600 font-bold bg-violet-50">+ Criar nova Categoria</option>
                                                {localCategories?.map((c: any) => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>

                                            {isCreatingCategory && (
                                                <div className="animate-in fade-in slide-in-from-top-2">
                                                    <input
                                                        type="text"
                                                        value={newCategoryName}
                                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                                        placeholder="Digite o nome da nova categoria"
                                                        autoFocus
                                                        className="w-full bg-white border border-violet-200 rounded-xl px-4 py-3 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium text-sm shadow-sm shadow-violet-100"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {toolForm.formState.errors.categoryId && <p className="text-xs text-red-500 font-medium">{toolForm.formState.errors.categoryId.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Valor da Diária (R$)</label>
                                        <input
                                            type="number"
                                            {...toolForm.register('dailyRate')}
                                            placeholder="120.00"
                                            className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium"
                                        />
                                        {toolForm.formState.errors.dailyRate && <p className="text-xs text-red-500 font-medium">{toolForm.formState.errors.dailyRate.message}</p>}
                                    </div>
                                </form>
                            </div>
                        </StepCard>
                    )}

                    {/* ─── STEP 3: CUSTOMER */}
                    {step === 3 && (
                        <StepCard
                            onNext={customerForm.handleSubmit((d) => createCustomer.mutate(d))}
                            onBack={() => setStep(2)}
                            onSkip={() => { updateStep.mutate(4); setStep(4); }}
                            showSkip={true}
                            isLoading={createCustomer.isPending}
                        >
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight font-outfit">Primeiro Cliente</h2>
                                    <p className="text-zinc-500 text-sm mt-2">Para quem você vai alugar esta ferramenta hoje?</p>
                                </div>

                                <form className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Nome Completo / Empresa</label>
                                        <input
                                            {...customerForm.register('fullName')}
                                            placeholder="Ex: Construtora Silva LTDA"
                                            className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium"
                                        />
                                        {customerForm.formState.errors.fullName && <p className="text-xs text-red-500 font-medium">{customerForm.formState.errors.fullName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Celular (WhatsApp)</label>
                                        <input
                                            {...customerForm.register('phoneNumber')}
                                            placeholder="11 99999-9999"
                                            className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium"
                                        />
                                        {customerForm.formState.errors.phoneNumber && <p className="text-xs text-red-500 font-medium">{customerForm.formState.errors.phoneNumber.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">CPF / CNPJ</label>
                                        <input
                                            {...customerForm.register('documentNumber')}
                                            placeholder="000.000.000-00"
                                            className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium"
                                        />
                                        {customerForm.formState.errors.documentNumber && <p className="text-xs text-red-500 font-medium">{customerForm.formState.errors.documentNumber.message}</p>}
                                    </div>
                                </form>
                            </div>
                        </StepCard>
                    )}

                    {/* ─── STEP 4: RENTAL */}
                    {step === 4 && (
                        <StepCard
                            onNext={handleFinalStep}
                            onBack={() => setStep(3)}
                            showSkip={false}
                            nextLabel="Completar Onboarding"
                            isLoading={createRental.isPending || completeOnboarding.isPending}
                        >
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight font-outfit">Criar Locação</h2>
                                    <p className="text-zinc-500 text-sm mt-2">Pronto, agora vamos vincular o equipamento ao cliente.</p>
                                </div>

                                <form className="space-y-5">
                                    <div className="space-y-2 relative">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Equipamento</label>
                                        <input
                                            value={createdTool?.name || 'Ferramenta Padrão (Simulado)'}
                                            readOnly
                                            className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-500 outline-none font-medium cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Cliente</label>
                                        <input
                                            value={createdCustomer?.fullName || 'Cliente Padrão (Simulado)'}
                                            readOnly
                                            className="w-full bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-500 outline-none font-medium cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Retirada</label>
                                            <input
                                                type="date"
                                                {...rentalForm.register('startDate')}
                                                className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Devolução Prevista</label>
                                            <input
                                                type="date"
                                                {...rentalForm.register('endDateExpected')}
                                                className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Valor Fechado da Diária (R$)</label>
                                        <input
                                            type="number"
                                            {...rentalForm.register('dailyRateAgreed')}
                                            className="w-full bg-slate-50 border border-zinc-200 rounded-xl px-4 py-3.5 text-zinc-900 placeholder:text-zinc-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all font-medium"
                                        />
                                        {rentalForm.formState.errors.dailyRateAgreed && <p className="text-xs text-red-500 font-medium">{rentalForm.formState.errors.dailyRateAgreed.message}</p>}
                                    </div>
                                </form>
                            </div>
                        </StepCard>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
