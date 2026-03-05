'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    CheckCircle2,
    ArrowRight,
    HardHat,
    Users,
    Calendar,
    Loader2,
    Sparkles,
    ChevronRight,
    ArrowLeft,
    Box,
    Plus,
    Building2,
    Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ─── Step Schemas ───────────────────────────────────────────────────────────

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
    toolId: z.string().uuid('Ferramenta obrigatória'),
    customerId: z.string().uuid('Cliente obrigatório'),
    startDate: z.string(),
    endDateExpected: z.string(),
    dailyRateAgreed: z.coerce.number().min(0),
});

type ToolForm = z.infer<typeof toolSchema>;
type CustomerForm = z.infer<typeof customerSchema>;
type RentalForm = z.infer<typeof rentalSchema>;

// ─── Components ─────────────────────────────────────────────────────────────

function StepWrapper({
    title,
    count,
    current,
    children,
    onNext,
    onBack,
    nextLabel = 'Próximo',
    isLoading = false,
    showNext = true,
    showBack = true
}: any) {
    return (
        <div className="w-full max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-extrabold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        Passo {current} de {count}
                    </span>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight font-heading">{title}</h1>
            </div>

            <div className="bg-white border border-zinc-100 rounded-3xl p-8 shadow-sm">
                {children}

                <div className="flex items-center justify-between gap-4 mt-10 pt-8 border-t border-zinc-50">
                    {showBack ? (
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors flex items-center"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                        </button>
                    ) : <div />}

                    {showNext && (
                        <button
                            onClick={onNext}
                            disabled={isLoading}
                            className="btn-primary w-auto px-8 h-12"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>{nextLabel} <ChevronRight className="w-4 h-4 ml-2" /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function OnboardingPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [createdTool, setCreatedTool] = useState<any>(null);
    const [createdCustomer, setCreatedCustomer] = useState<any>(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

    // Queries
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => (await api.get('/tool-categories')).data.data
    });

    const { data: toolsList } = useQuery({
        queryKey: ['tools-onboarding'],
        queryFn: async () => (await api.get('/tools')).data.data
    });

    const { data: customersList } = useQuery({
        queryKey: ['customers-onboarding'],
        queryFn: async () => (await api.get('/customers')).data.data
    });

    // Forms
    const toolForm = useForm<ToolForm>({ resolver: zodResolver(toolSchema) as any });
    const customerForm = useForm<CustomerForm>({ resolver: zodResolver(customerSchema) as any });
    const rentalForm = useForm<RentalForm>({
        resolver: zodResolver(rentalSchema) as any,
        defaultValues: {
            startDate: new Date().toISOString().split('T')[0],
            endDateExpected: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
        }
    });

    // Mutations
    const createTool = useMutation({
        mutationFn: async (data: ToolForm) => (await api.post('/tools', data)).data.data,
        onSuccess: (tool: any) => {
            setCreatedTool(tool);
            setStep(3);
            toast.success('Ferramenta cadastrada!');
        }
    });

    const createCustomer = useMutation({
        mutationFn: async (data: CustomerForm) => (await api.post('/customers', data)).data.data,
        onSuccess: (customer: any) => {
            setCreatedCustomer(customer);
            setStep(4);
            toast.success('Cliente cadastrado!');
        }
    });

    const createRental = useMutation({
        mutationFn: async (data: RentalForm) => (await api.post('/rentals', data)).data.data,
        onSuccess: () => {
            setStep(5);
            toast.success('Aluguel simulado com sucesso!');
        }
    });

    const completeOnboarding = useMutation({
        mutationFn: async () => await api.post('/onboarding/finish'),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['onboarding-status'] });
            router.push('/dashboard');
        }
    });

    // Effects to sync rental form
    useEffect(() => {
        if (createdTool) rentalForm.setValue('toolId', createdTool.id);
        if (createdCustomer) rentalForm.setValue('customerId', createdCustomer.id);
        if (createdTool?.dailyRate) rentalForm.setValue('dailyRateAgreed', createdTool.dailyRate);
    }, [createdTool, createdCustomer, rentalForm]);

    const stepsCount = 5;

    return (
        <div className="min-h-screen bg-[#FAFAFA] py-12 px-6 flex flex-col items-center">

            {/* Header / Logo */}
            <div className="mb-12 flex items-center gap-2">
                <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">L</div>
                <span className="font-bold text-2xl text-zinc-900 tracking-tight font-heading">Locattus</span>
            </div>

            {/* Step 1: Welcome */}
            {step === 1 && (
                <div className="w-full max-w-xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
                    <div className="space-y-4">
                        <div className="w-20 h-20 bg-violet-100 text-violet-600 rounded-3xl flex items-center justify-center mx-auto">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight font-heading">Bem-vindo ao Locattus.</h1>
                        <p className="text-zinc-500 text-lg max-w-md mx-auto">Vamos configurar sua locadora em poucos passos para você começar a faturar hoje mesmo.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-left max-w-sm mx-auto">
                        {[
                            { icon: HardHat, label: 'Adicione sua primeira ferramenta', checked: false },
                            { icon: Users, label: 'Crie seu primeiro cliente', checked: false },
                            { icon: Calendar, label: 'Simule seu primeiro aluguel', checked: false },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                                <div className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-400 flex items-center justify-center">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-semibold text-zinc-700">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center">
                        <button
                            onClick={() => setStep(2)}
                            className="btn-primary w-full max-w-xs h-14 text-lg"
                        >
                            Começar configuração <ChevronRight className="w-5 h-5 ml-2" />
                        </button>
                    </div>

                    <p className="text-zinc-400 text-sm">Tempo estimado: 3 minutos</p>
                </div>
            )}

            {/* Step 2: Tool */}
            {step === 2 && (
                <StepWrapper
                    title="Sua primeira ferramenta"
                    current={2}
                    count={stepsCount}
                    onNext={toolForm.handleSubmit((data: any) => createTool.mutate(data))}
                    onBack={() => setStep(1)}
                    isLoading={createTool.isPending}
                >
                    <p className="text-zinc-500 mb-6">Cadastre um equipamento para começar a controlar seu estoque e aluguéis.</p>
                    <form className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="label">Nome do Equipamento</label>
                            <input
                                {...toolForm.register('name')}
                                placeholder="Ex: Betoneira 400L CSM"
                                className="input-field"
                            />
                            {toolForm.formState.errors.name && <p className="text-xs text-red-500">{toolForm.formState.errors.name.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">Categoria</label>
                            {!isCreatingCategory ? (
                                <div className="space-y-2">
                                    <select
                                        {...toolForm.register('categoryId')}
                                        onChange={(e) => {
                                            if (e.target.value === 'NEW') {
                                                setIsCreatingCategory(true);
                                                toolForm.setValue('categoryId', '' as any);
                                            }
                                        }}
                                        className="input-field appearance-none"
                                    >
                                        <option value="">Selecione uma categoria</option>
                                        <option value="NEW" className="text-violet-600 font-bold">+ Criar nova categoria</option>
                                        {categories?.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Nome da nova categoria"
                                        className="input-field"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newCategoryName) return;
                                            try {
                                                const res = await api.post('/tool-categories', { name: newCategoryName });
                                                const newCat = res.data.data;
                                                await queryClient.invalidateQueries({ queryKey: ['categories'] });
                                                toolForm.setValue('categoryId', newCat.id);
                                                setIsCreatingCategory(false);
                                                setNewCategoryName('');
                                                toast.success('Categoria criada!');
                                            } catch (err) {
                                                toast.error('Erro ao criar categoria');
                                            }
                                        }}
                                        className="px-4 bg-violet-500 text-white rounded-xl hover:bg-violet-600 transition-colors"
                                    >
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingCategory(false)}
                                        className="px-4 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 transition-colors"
                                    >
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>
                            )}
                            {toolForm.formState.errors.categoryId && <p className="text-xs text-red-500">{toolForm.formState.errors.categoryId.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">Valor do aluguel (por dia)</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold select-none pointer-events-none">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...toolForm.register('dailyRate')}
                                    className="input-field pl-14"
                                    placeholder="0,00"
                                />
                            </div>
                            {toolForm.formState.errors.dailyRate && <p className="text-xs text-red-500">{toolForm.formState.errors.dailyRate.message}</p>}
                        </div>
                    </form>
                </StepWrapper>
            )}

            {/* Step 3: Customer */}
            {step === 3 && (
                <StepWrapper
                    title="Seu primeiro cliente"
                    current={3}
                    count={stepsCount}
                    onNext={customerForm.handleSubmit((data) => createCustomer.mutate(data))}
                    onBack={() => setStep(2)}
                    isLoading={createCustomer.isPending}
                >
                    <p className="text-zinc-500 mb-6">Clientes cadastrados permitem criar contratos com validade jurídica e histórico de pagamentos.</p>
                    <form className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="label">Nome Completo</label>
                            <input
                                {...customerForm.register('fullName')}
                                placeholder="Ex: José da Silva"
                                className="input-field"
                            />
                            {customerForm.formState.errors.fullName && <p className="text-xs text-red-500">{customerForm.formState.errors.fullName.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">WhatsApp / Telefone</label>
                            <input
                                {...customerForm.register('phoneNumber')}
                                placeholder="(11) 99999-9999"
                                className="input-field"
                            />
                            {customerForm.formState.errors.phoneNumber && <p className="text-xs text-red-500">{customerForm.formState.errors.phoneNumber.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <label className="label">CPF ou CNPJ</label>
                            <input
                                {...customerForm.register('documentNumber')}
                                placeholder="000.000.000-00"
                                className="input-field"
                            />
                            {customerForm.formState.errors.documentNumber && <p className="text-xs text-red-500">{customerForm.formState.errors.documentNumber.message}</p>}
                        </div>
                    </form>
                </StepWrapper>
            )}

            {/* Step 4: Rental */}
            {step === 4 && (
                <StepWrapper
                    title="Simule seu primeiro aluguel"
                    current={4}
                    count={stepsCount}
                    onNext={rentalForm.handleSubmit((data: any) => createRental.mutate(data))}
                    onBack={() => setStep(3)}
                    isLoading={createRental.isPending}
                    nextLabel="Criar Aluguel"
                >
                    <p className="text-zinc-500 mb-6">Agora vamos unir tudo e simular a saída de um equipamento.</p>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Ferramenta</p>
                            <p className="text-sm font-bold text-zinc-900">{createdTool?.name}</p>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <p className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest mb-1">Cliente</p>
                            <p className="text-sm font-bold text-zinc-900">{createdCustomer?.fullName}</p>
                        </div>
                    </div>

                    <form className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
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
                            <label className="label">Valor Total Acordado</label>
                            <div className="relative">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold select-none pointer-events-none">R$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...rentalForm.register('dailyRateAgreed')}
                                    className="input-field pl-14"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    </form>
                </StepWrapper>
            )}

            {/* Step 5: Success */}
            {step === 5 && (
                <div className="w-full max-w-xl mx-auto space-y-10 animate-in fade-in zoom-in-95 duration-700 text-center">
                    <div className="space-y-4">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                            <Check className="w-12 h-12 stroke-[3px]" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight font-heading">Pronto para rodar!</h1>
                        <p className="text-zinc-500 text-lg max-w-md mx-auto">Sua locadora foi configurada com sucesso. Agora você tem acesso total ao painel de inteligência.</p>
                    </div>

                    <div className="bg-white border border-zinc-100 rounded-3xl p-8 space-y-6">
                        <div className="space-y-4">
                            {[
                                'Acompanhe aluguéis em tempo real',
                                'Gere contratos profissionais em PDF',
                                'Veja a saúde financeira do seu negócio',
                                'Receba alertas de atraso e manutenção'
                            ].map((text, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                    <span className="text-sm font-medium text-zinc-700">{text}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => completeOnboarding.mutate()}
                            disabled={completeOnboarding.isPending}
                            className="btn-primary w-full h-14 text-lg"
                        >
                            {completeOnboarding.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Ir para o Dashboard'}
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
