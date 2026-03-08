'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToolSearch } from '../shared/ToolSearch';
import { CustomerSearch } from '../shared/CustomerSearch';
import { cn, formatCurrency } from '@/lib/utils';
import { Tool, Customer } from '@/types';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Zap } from 'lucide-react';

const checkoutSchema = z.object({
    toolId: z.string().uuid('Selecione um equipamento'),
    customerId: z.string().uuid('Selecione um responsável'),
    startDate: z.string(),
    endDateExpected: z.string(),
    dailyRateAgreed: z.number().min(0),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

interface RentalCheckoutProps {
    onSubmit: (data: CheckoutValues) => void;
    isLoading?: boolean;
    initialToolId?: string;
    initialCustomerId?: string;
}

export function RentalCheckout({ onSubmit, isLoading, initialToolId, initialCustomerId }: RentalCheckoutProps) {
    const [step, setStep] = useState(initialToolId ? 2 : 1);
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Fetch initial tool if provided
    useQuery({
        queryKey: ['tool', initialToolId],
        queryFn: async () => {
            const res = await api.get(`/tools/${initialToolId}`);
            const tool = res.data.data;
            setSelectedTool(tool);
            setValue('toolId', tool.id);
            setValue('dailyRateAgreed', tool.dailyRate);
            return tool;
        },
        enabled: !!initialToolId,
    });

    // Fetch initial customer if provided
    useQuery({
        queryKey: ['customer', initialCustomerId],
        queryFn: async () => {
            const res = await api.get(`/customers/${initialCustomerId}`);
            const customer = res.data.data;
            setSelectedCustomer(customer);
            setValue('customerId', customer.id);
            if (initialToolId) setStep(3);
            return customer;
        },
        enabled: !!initialCustomerId,
    });

    const { register, handleSubmit, setValue, watch } = useForm<CheckoutValues>({
        resolver: zodResolver(checkoutSchema),
        defaultValues: {
            toolId: initialToolId || undefined,
            customerId: initialCustomerId || undefined,
            startDate: new Date().toISOString().split('T')[0],
            endDateExpected: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            dailyRateAgreed: 0,
        },
    });

    const startDate = watch('startDate');
    const endDate = watch('endDateExpected');
    const dailyRate = watch('dailyRateAgreed');

    const calculateTotal = () => {
        if (!startDate || !endDate || !dailyRate) return 0;
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
        return diff * dailyRate;
    };

    const nextStep = () => {
        if (step === 1 && !selectedTool) return;
        if (step === 2 && !selectedCustomer) return;
        setStep(step + 1);
    };

    const prevStep = () => setStep(step - 1);

    const handleToolSelect = (tool: Tool) => {
        setSelectedTool(tool);
        setValue('toolId', tool.id);
        setValue('dailyRateAgreed', tool.dailyRate ? parseFloat(tool.dailyRate) : 0);
        setStep(2); // Auto-advance to customer selection
    };

    const handleCustomerSelect = (customer: Customer) => {
        setSelectedCustomer(customer);
        setValue('customerId', customer.id);
        setStep(3); // Auto-advance to details
    };

    return (
        <div className="space-y-6 pt-4">
            {/* Stepper */}
            <div className="flex items-center justify-between px-6 mb-10">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all duration-500 border-2",
                            step === s
                                ? "bg-primary text-white border-primary shadow-premium scale-110"
                                : step > s
                                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                                    : "bg-white text-muted-foreground border-border"
                        )}>
                            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={cn("w-20 h-[2px] mx-3 rounded-full transition-colors duration-500", step > s ? "bg-emerald-500" : "bg-border")} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <Label className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground">1. Equipamento para Locação</Label>
                        {selectedTool && <span className="text-[10px] text-primary font-extrabold uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Ativo: {selectedTool.name}</span>}
                    </div>
                    <ToolSearch onSelect={handleToolSelect} selectedId={selectedTool?.id} />
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <Label className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground">2. Responsável / Cliente</Label>
                        {selectedCustomer && <span className="text-[10px] text-primary font-extrabold uppercase tracking-widest bg-primary/5 px-2 py-1 rounded">Selecionado: {selectedCustomer.fullName}</span>}
                    </div>
                    <CustomerSearch onSelect={handleCustomerSelect} selectedId={selectedCustomer?.id} />
                </div>
            )}

            {step === 3 && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                    <Label className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground border-b border-border pb-4 block">3. Detalhes de Locação</Label>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 bg-muted/30 border border-dashed border-border rounded-premium p-6 grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-widest mb-2">Item Vinculado</p>
                                <p className="text-sm font-bold text-foreground">{selectedTool?.name}</p>
                                <p className="text-[10px] font-semibold text-primary mt-1 uppercase">{selectedTool?.brand} · {selectedTool?.assetTag}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase text-muted-foreground font-extrabold tracking-widest mb-2">Locatário</p>
                                <p className="text-sm font-bold text-foreground">{selectedCustomer?.fullName}</p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-1 uppercase">{selectedCustomer?.documentNumber}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-[10px] font-bold uppercase tracking-widest ml-1">Início da Locação</Label>
                            <Input id="startDate" type="date" {...register('startDate')} className="rounded-button border-border focus:ring-primary/20" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endDateExpected" className="text-[10px] font-bold uppercase tracking-widest ml-1">Previsão de Retorno</Label>
                            <Input id="endDateExpected" type="date" {...register('endDateExpected')} className="rounded-button border-border focus:ring-primary/20" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dailyRateAgreed" className="text-[10px] font-bold uppercase tracking-widest ml-1">Preço Acordado (Diária)</Label>
                            <Input
                                id="dailyRateAgreed"
                                type="number"
                                step="0.01"
                                {...register('dailyRateAgreed', { valueAsNumber: true })}
                                className="rounded-button border-border font-bold text-primary"
                            />
                        </div>

                        <div className="bg-foreground rounded-premium p-8 flex flex-col justify-center items-center text-white col-span-2 shadow-float group">
                            <p className="text-[10px] uppercase text-white/50 font-extrabold tracking-[0.2em] mb-2 group-hover:text-primary transition-colors">Estimativa de Faturamento</p>
                            <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(calculateTotal())}</p>
                            <p className="text-[10px] font-bold text-white/30 mt-2 uppercase tracking-widest italic">Baseado em diárias simples</p>
                        </div>
                    </div>
                </form>
            )}

            <div className="flex items-center justify-between pt-8 border-t border-border mt-10">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 1 || (!!initialToolId && step === 2)}
                    className="rounded-button text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all font-bold uppercase text-[10px] tracking-widest h-12 px-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                </Button>

                {step < 3 ? (
                    <Button
                        type="button"
                        onClick={nextStep}
                        disabled={(step === 1 && !selectedTool) || (step === 2 && !selectedCustomer)}
                        className="bg-primary hover:bg-primary/90 text-white rounded-button px-10 h-12 font-extrabold uppercase text-[10px] tracking-widest shadow-premium transition-all"
                    >
                        Próximo Passo <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button
                        type="button"
                        onClick={handleSubmit(onSubmit)}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-button px-12 h-12 font-extrabold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 transition-all group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                                Finalizar Locação
                            </div>
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}
