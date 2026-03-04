'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useEffect } from 'react';

const quoteSchema = z.object({
    toolId: z.string().uuid('Selecione um equipamento'),
    customerId: z.string().uuid('Selecione um cliente'),
    startDate: z.string().min(1, 'Data de início obrigatória'),
    endDateExpected: z.string().min(1, 'Data de retorno obrigatória'),
    totalAmount: z.string().min(1, 'Valor total obrigatório'),
    validUntil: z.string().optional(),
    notes: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
    initialData?: any;
    onSubmit: (data: QuoteFormValues) => void;
    isLoading?: boolean;
}

export function QuoteForm({ initialData, onSubmit, isLoading }: QuoteFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            ...initialData,
            totalAmount: initialData?.totalAmount?.toString() || '',
            validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
        },
    });

    const { data: tools } = useQuery({
        queryKey: ['tools-available'],
        queryFn: async () => (await api.get('/tools?status=available')).data.data,
    });

    const { data: customers } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => (await api.get('/customers')).data.data,
    });

    const selectedToolId = watch('toolId');
    const startDate = watch('startDate');
    const endDateExpected = watch('endDateExpected');
    const selectedTool = tools?.find((t: any) => t.id === selectedToolId);

    // Auto-calculate total amount
    useEffect(() => {
        if (selectedTool && startDate && endDateExpected) {
            const start = new Date(startDate);
            const end = new Date(endDateExpected);
            if (end > start) {
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const total = (diffDays * parseFloat(selectedTool.dailyRate)).toFixed(2);
                setValue('totalAmount', total);
            }
        }
    }, [selectedTool, startDate, endDateExpected, setValue]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                    <Label>Equipamento</Label>
                    <Select
                        onValueChange={(v) => setValue('toolId', v)}
                        defaultValue={initialData?.toolId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o equipamento" />
                        </SelectTrigger>
                        <SelectContent>
                            {tools?.map((t: any) => (
                                <SelectItem key={t.id} value={t.id}>{t.name} ({t.assetTag})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.toolId && <p className="text-xs text-red-500">{errors.toolId.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Cliente</Label>
                    <Select
                        onValueChange={(v) => setValue('customerId', v)}
                        defaultValue={initialData?.customerId}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione o cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers?.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="startDate">Data Início</Label>
                        <Input id="startDate" type="date" {...register('startDate')} />
                        {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endDateExpected">Retorno Previsto</Label>
                        <Input id="endDateExpected" type="date" {...register('endDateExpected')} />
                        {errors.endDateExpected && <p className="text-xs text-red-500">{errors.endDateExpected.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="totalAmount">Valor Estimado (R$)</Label>
                    <div className="relative">
                        <Input
                            id="totalAmount"
                            {...register('totalAmount')}
                            placeholder="0.00"
                            className="pl-8 font-bold text-violet-600"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">R$</span>
                    </div>
                    {selectedTool && (
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-2">
                            Taxa Diária: <span className="text-violet-500">R$ {selectedTool.dailyRate}</span>
                        </p>
                    )}
                    {errors.totalAmount && <p className="text-xs text-red-500">{errors.totalAmount.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="validUntil">Validade do Orçamento</Label>
                        <Input id="validUntil" type="date" {...register('validUntil')} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Observações Internas</Label>
                    <textarea
                        id="notes"
                        {...register('notes')}
                        className="w-full min-h-[80px] rounded-xl border border-zinc-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                        placeholder="Ex: Cliente solicitou desconto se alugar por 15 dias..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-violet-50 mt-4">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-[10px] py-6 rounded-xl shadow-lg shadow-violet-100 w-full">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Salvar Alterações' : 'Gerar Orçamento / Reserva'}
                </Button>
            </div>
        </form>
    );
}
