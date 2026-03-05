'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Loader2, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CategoryForm } from './CategoryForm';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';


interface ToolFormValues {
    name: string;
    categoryId: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    assetTag?: string;
    dailyRate: number;
    minRentalValue?: number;
    cleaningFee?: number;
    status: 'available' | 'rented' | 'maintenance' | 'unavailable' | 'lost' | 'sold';
    nextMaintenanceDueHours?: number;
    acquisitionDate?: string;
    acquisitionCost?: number;
    notes?: string;
}

const toolSchema: z.ZodType<ToolFormValues> = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    categoryId: z.string().min(1, 'Selecione uma categoria'),
    brand: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    assetTag: z.string().optional(),
    dailyRate: z.coerce.number().min(0, 'Valor inválido'),
    minRentalValue: z.coerce.number().min(0).optional(),
    cleaningFee: z.coerce.number().min(0).optional(),
    status: z.enum(['available', 'rented', 'maintenance', 'unavailable', 'lost', 'sold']).default('available'),
    nextMaintenanceDueHours: z.coerce.number().optional().nullable() as any,
    acquisitionDate: z.string().optional().nullable() as any,
    acquisitionCost: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
});

interface ToolFormProps {
    initialData?: any;
    onSubmit: (data: ToolFormValues) => void;
    isLoading?: boolean;
}

export function ToolForm({ initialData, onSubmit, isLoading }: ToolFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ToolFormValues>({
        resolver: zodResolver(toolSchema as any),
        defaultValues: initialData || {
            status: 'available',
            dailyRate: 0,
            acquisitionCost: 0,
            minRentalValue: 0,
            cleaningFee: 0,
        },
    });

    const queryClient = useQueryClient();
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/tool-categories');
            return res.data.data;
        },
    });

    const createCategoryMutation = useMutation({
        mutationFn: (data: any) => api.post('/tool-categories', data),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            const newId = res.data?.data?.id || res.data?.id;
            if (newId) {
                setValue('categoryId', newId, { shouldValidate: true });
            }
            setIsCategoryDialogOpen(false);
            toast.success('Categoria criada!');
        },
        onError: () => toast.error('Erro ao criar categoria'),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ── Seção: Identificação Principal ── */}
                <div className="col-span-full space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-500" /> Identificação Base
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="name">Nome da Ferramenta</Label>
                            <Input id="name" {...register('name')} placeholder="Ex: Betoneira 400L" className="h-12 rounded-xl" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2 text-foreground">
                            <Label>Categoria</Label>
                            <Select
                                onValueChange={(v) => {
                                    if (v === 'ADD_NEW') {
                                        setTimeout(() => setIsCategoryDialogOpen(true), 50);
                                    } else {
                                        setValue('categoryId', v);
                                    }
                                }}
                                defaultValue={initialData?.categoryId}
                                value={watch('categoryId')}
                            >
                                <SelectTrigger className="h-12 bg-white border-zinc-200 rounded-xl">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px] bg-white border-zinc-100 shadow-xl z-[100] text-foreground">
                                    <SelectItem
                                        value="ADD_NEW"
                                        className="flex items-center gap-2 p-3 text-[10px] font-black text-violet-600 uppercase tracking-widest hover:bg-violet-50 focus:bg-violet-50 border-b border-zinc-50 mb-1 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5 mr-2 inline" />
                                        Nova Categoria
                                    </SelectItem>

                                    {categories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id} className="cursor-pointer">
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden shadow-2xl">
                                    <div className="px-8 py-6 border-b border-zinc-100 bg-zinc-50/50">
                                        <DialogTitle className="font-bold text-xl text-foreground">Nova Categoria</DialogTitle>
                                    </div>
                                    <div className="p-8">
                                        <CategoryForm
                                            onSubmit={(data) => createCategoryMutation.mutate(data)}
                                            isLoading={createCategoryMutation.isPending}
                                        />
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status Operacional</Label>
                            <Select
                                onValueChange={(v: any) => setValue('status', v)}
                                defaultValue={initialData?.status || 'available'}
                            >
                                <SelectTrigger className="h-12 bg-white border-zinc-200 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-foreground">
                                    <SelectItem value="available">Disponível</SelectItem>
                                    <SelectItem value="rented">Alugado</SelectItem>
                                    <SelectItem value="maintenance">Manutenção</SelectItem>
                                    <SelectItem value="unavailable">Indisponível</SelectItem>
                                    <SelectItem value="lost">Extraviado/Perdido</SelectItem>
                                    <SelectItem value="sold">Vendido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Seção: Financeiro ── */}
                <div className="col-span-full space-y-4 pt-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Precificação & Taxas
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dailyRate">Diária (R$)</Label>
                            <Input id="dailyRate" type="number" step="0.01" {...register('dailyRate')} className="h-12 rounded-xl font-bold text-violet-600" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minRentalValue">Valor Mínimo (R$)</Label>
                            <Input id="minRentalValue" type="number" step="0.01" {...register('minRentalValue')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cleaningFee">Taxa Limpeza (R$)</Label>
                            <Input id="cleaningFee" type="number" step="0.01" {...register('cleaningFee')} className="h-12 rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* ── Seção: Ciclo de Vida ── */}
                <div className="col-span-full space-y-4 pt-4">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Gestão de Patrimônio
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionCost">Custo de Aquisição (R$)</Label>
                            <Input id="acquisitionCost" type="number" step="0.01" {...register('acquisitionCost')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionDate">Data de Compra</Label>
                            <Input id="acquisitionDate" type="date" {...register('acquisitionDate')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand">Marca</Label>
                            <Input id="brand" {...register('brand')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assetTag">Nº Patrimônio (Tag)</Label>
                            <Input id="assetTag" {...register('assetTag')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serialNumber">Nº de Série</Label>
                            <Input id="serialNumber" {...register('serialNumber')} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nextMaintenanceDueHours">Alerta p/ Manutenção (Horas)</Label>
                            <Input id="nextMaintenanceDueHours" type="number" {...register('nextMaintenanceDueHours')} className="h-12 rounded-xl" />
                        </div>
                    </div>
                </div>

                <div className="col-span-full space-y-2 pt-4">
                    <Label htmlFor="notes">Observações e Histórico</Label>
                    <textarea
                        id="notes"
                        {...register('notes')}
                        className="w-full min-h-[100px] p-4 rounded-2xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-foreground"
                        placeholder="Detalhes adicionais sobre o estado do equipamento..."
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-8 border-t border-zinc-100">
                <Button type="submit" disabled={isLoading} className="bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-[11px] h-14 px-8 rounded-2xl shadow-xl active:scale-95 transition-all">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Atualizar Inventário' : 'Cadastrar na Frota'}
                </Button>
            </div>
        </form>
    );
}
