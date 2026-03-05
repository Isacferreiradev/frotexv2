'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Calculator, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';

const quoteSchema = z.object({
    customerId: z.string().uuid('Selecione um cliente'),
    startDate: z.string().min(1, 'Data de início obrigatória'),
    endDateExpected: z.string().min(1, 'Data de retorno obrigatória'),
    items: z.array(z.object({
        toolId: z.string().uuid('Selecione um equipamento'),
        quantity: z.number().int().min(1).default(1),
        dailyRate: z.coerce.number().min(0),
    })).min(1, 'Adicione pelo menos um item'),
    totalDiscount: z.coerce.number().min(0).default(0),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
    termsAndConditions: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    isLoading?: boolean;
}

export function QuoteForm({ initialData, onSubmit, isLoading }: QuoteFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema) as any,
        defaultValues: {
            customerId: initialData?.customerId || '',
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDateExpected: initialData?.endDateExpected ? new Date(initialData.endDateExpected).toISOString().split('T')[0] : '',
            items: initialData?.items?.map((item: any) => ({
                toolId: item.toolId,
                quantity: item.quantity,
                dailyRate: parseFloat(item.dailyRate),
            })) || [{ toolId: '', quantity: 1, dailyRate: 0 }],
            totalDiscount: initialData?.totalDiscount ? parseFloat(initialData.totalDiscount) : 0,
            validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
            notes: initialData?.notes || '',
            termsAndConditions: initialData?.termsAndConditions || '',
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "items"
    });

    const { data: tools } = useQuery({
        queryKey: ['tools'],
        queryFn: async () => (await api.get('/tools')).data.data,
    });

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => (await api.get('/customers')).data.data,
    });

    const watchedItems = watch('items');
    const startDate = watch('startDate');
    const endDateExpected = watch('endDateExpected');
    const totalDiscount = watch('totalDiscount');

    // Calculate duration in days
    const days = (() => {
        if (!startDate || !endDateExpected) return 1;
        const start = new Date(startDate);
        const end = new Date(endDateExpected);
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return 1;
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    })();

    // Calculate subtotal
    const subtotal = (watchedItems || []).reduce((acc, item) => {
        return acc + ((item?.dailyRate || 0) * (item?.quantity || 1) * days);
    }, 0);

    const total = Math.max(0, subtotal - (totalDiscount || 0));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in duration-500">
            {/* Customer & Period */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100">
                <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Cliente Solicitante</Label>
                    <Select
                        onValueChange={(v: string) => setValue('customerId', v)}
                        defaultValue={initialData?.customerId}
                    >
                        <SelectTrigger className="h-12 rounded-xl bg-white border-zinc-200">
                            <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.customerId && <p className="text-[10px] text-red-500 font-medium ml-1">{errors.customerId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Início</Label>
                        <Input type="date" className="h-12 rounded-xl bg-white border-zinc-200" {...register('startDate')} />
                    </div>
                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Fim Previsto</Label>
                        <Input type="date" className="h-12 rounded-xl bg-white border-zinc-200" {...register('endDateExpected')} />
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-200">
                <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                        <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-900 shadow-sm">Itens do Orçamento</Label>
                        <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full">{fields.length}</span>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ toolId: '', quantity: 1, dailyRate: 0 })}
                        className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-bold uppercase tracking-widest px-4"
                    >
                        <Plus className="w-3.5 h-3.5" /> Adicionar Ferramenta
                    </Button>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => {
                        const selectedToolId = watchedItems?.[index]?.toolId;

                        return (
                            <div key={field.id} className="group grid grid-cols-12 gap-3 p-4 bg-white border border-zinc-200 rounded-2xl items-end transition-all hover:bg-zinc-50/50 hover:border-primary/20 relative">
                                <div className="col-span-12 md:col-span-5 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Ferramenta</Label>
                                    <Select
                                        onValueChange={(v: string) => {
                                            setValue(`items.${index}.toolId`, v);
                                            const tool = tools?.find((t: any) => t.id === v);
                                            if (tool) setValue(`items.${index}.dailyRate`, parseFloat(tool.dailyRate));
                                        }}
                                        defaultValue={field.toolId}
                                    >
                                        <SelectTrigger className="bg-transparent border-none shadow-none focus:ring-0 px-1 font-bold h-7">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tools?.map((t: any) => (
                                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.assetTag})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <div className="h-[1px] bg-zinc-100 w-full" />
                                </div>

                                <div className="col-span-4 md:col-span-2 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Qtd</Label>
                                    <Input
                                        type="number"
                                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                                        className="bg-transparent border-none shadow-none focus:ring-0 px-1 font-bold h-7 tabular-nums"
                                    />
                                    <div className="h-[1px] bg-zinc-100 w-full" />
                                </div>

                                <div className="col-span-5 md:col-span-3 space-y-2">
                                    <Label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Diária (R$)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        {...register(`items.${index}.dailyRate`, { valueAsNumber: true })}
                                        className="bg-transparent border-none shadow-none focus:ring-0 px-1 font-bold h-7 tabular-nums text-primary"
                                    />
                                    <div className="h-[1px] bg-zinc-100 w-full" />
                                </div>

                                <div className="col-span-3 md:col-span-2 flex justify-end pb-1.5 px-1">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="p-2 text-zinc-300 hover:text-red-500 transition-colors bg-zinc-50 rounded-lg group-hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {errors.items && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase">{errors.items.message}</p>}
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                    <div className="space-y-2.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Validade do Orçamento</Label>
                        <Input type="date" className="h-12 rounded-xl border-zinc-200" {...register('validUntil')} />
                    </div>
                </div>

                <div className="bg-zinc-900 rounded-[32px] p-8 text-white space-y-6 shadow-premium relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

                    <div className="space-y-3 relative z-10">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                            <span>Resumo Financeiro</span>
                            <span className="text-zinc-400">{days} {days === 1 ? 'Dia' : 'Dias'}</span>
                        </div>

                        <div className="space-y-2 bg-white/5 p-4 rounded-xl backdrop-blur-sm border border-white/5">
                            <div className="flex justify-between text-xs text-zinc-400">
                                <span>Subtotal Bruto</span>
                                <span className="tabular-nums font-semibold">{formatCurrency(subtotal)}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs text-zinc-400">
                                <span>Desconto Global</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px]">R$</span>
                                    <input
                                        type="number"
                                        {...register('totalDiscount', { valueAsNumber: true })}
                                        className="w-20 bg-transparent border-b border-white/20 focus:border-primary focus:outline-none text-right font-bold text-white tabular-nums h-5"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-end pt-2 relative z-10">
                        <div>
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-1">Valor Final</p>
                            <p className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-medium">
                                <Info className="w-3 h-3" /> Inc. todas as ferramentas
                            </p>
                        </div>
                        <span className="text-4xl font-bold tracking-tighter tabular-nums bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                            {formatCurrency(total)}
                        </span>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-[0.2em] text-[11px] rounded-2xl shadow-xl shadow-primary/20 relative z-10 mt-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar e Gerar Orçamento'}
                    </Button>
                </div>
            </div>
        </form>
    );
}
