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
import { Loader2, Plus, Wrench, DollarSign } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CategoryForm } from './CategoryForm';
import { useState, useEffect } from 'react';
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
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 pb-8">
            <div className="space-y-12">
                {/* ── Identificação do Ativo ── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                            <Wrench className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.15em]">Identificação do Ativo</h4>
                            <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Informações básicas e categorização</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="col-span-full space-y-2">
                            <Label htmlFor="name" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Nome Comercial</Label>
                            <Input id="name" {...register('name')} placeholder="Ex: Martelo Perfurador Bosch 20kg" className="h-12 rounded-xl bg-slate-50 border-zinc-200 focus:bg-white transition-all" />
                            {errors.name && <p className="text-[10px] font-bold text-red-500 ml-1">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Categoria</Label>
                            {!isCreatingCategory ? (
                                <Select
                                    onValueChange={(v) => {
                                        if (v === 'ADD_NEW') {
                                            setIsCreatingCategory(true);
                                            setValue('categoryId', '');
                                        } else {
                                            setValue('categoryId', v);
                                        }
                                    }}
                                    value={watch('categoryId')}
                                >
                                    <SelectTrigger className="h-12 bg-slate-50 border-zinc-200 rounded-xl focus:bg-white transition-all text-foreground">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px] bg-white border-zinc-100 shadow-xl z-[100] text-foreground">
                                        <SelectItem
                                            value="ADD_NEW"
                                            className="flex items-center gap-2 p-3 text-[10px] font-extrabold text-violet-600 uppercase tracking-widest hover:bg-violet-50 focus:bg-violet-50 border-b border-zinc-50 mb-1 cursor-pointer"
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
                            ) : (
                                <div className="flex gap-2">
                                    <Input
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        placeholder="Nova categoria..."
                                        className="h-12 rounded-xl flex-1 bg-white border-violet-200"
                                        autoFocus
                                    />
                                    <Button
                                        type="button"
                                        onClick={async () => {
                                            if (!newCategoryName) return;
                                            try {
                                                const res = await api.post('/tool-categories', { name: newCategoryName });
                                                const newCat = res.data.data;
                                                await queryClient.invalidateQueries({ queryKey: ['categories'] });
                                                setValue('categoryId', newCat.id);
                                                setIsCreatingCategory(false);
                                                setNewCategoryName('');
                                                toast.success('Categoria criada!');
                                            } catch (err) {
                                                toast.error('Erro ao criar categoria');
                                            }
                                        }}
                                        className="h-12 w-12 bg-violet-600 text-white rounded-xl hover:bg-violet-700 p-0 shadow-lg shadow-violet-100"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsCreatingCategory(false)}
                                        className="h-12 w-12 bg-zinc-100 text-zinc-500 rounded-xl hover:bg-zinc-200 p-0"
                                    >
                                        <Plus className="w-5 h-5 rotate-45" />
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Status Flash</Label>
                            <Select
                                onValueChange={(v: any) => setValue('status', v)}
                                defaultValue={initialData?.status || 'available'}
                            >
                                <SelectTrigger className="h-12 bg-slate-50 border-zinc-200 rounded-xl text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white text-foreground">
                                    <SelectItem value="available">✓ Disponível</SelectItem>
                                    <SelectItem value="rented">⟲ Alugado</SelectItem>
                                    <SelectItem value="maintenance">⚠ Manutenção</SelectItem>
                                    <SelectItem value="unavailable">× Indisponível</SelectItem>
                                    <SelectItem value="lost">? Extraviado</SelectItem>
                                    <SelectItem value="sold">$ Vendido</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* ── Precificação ── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.15em]">Precificação Operacional</h4>
                            <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Valores base para locação</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="dailyRate" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Diária Padrão</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-[10px] pointer-events-none">R$</span>
                                <Input id="dailyRate" type="number" step="0.01" {...register('dailyRate')} className="h-12 rounded-xl pl-12 bg-slate-50 border-zinc-200 font-bold text-zinc-900 text-base" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minRentalValue" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Mínimo (Carencia)</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px] pointer-events-none">R$</span>
                                <Input id="minRentalValue" type="number" step="0.01" {...register('minRentalValue')} className="h-12 rounded-xl pl-12 bg-slate-50 border-zinc-200" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cleaningFee" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Taxa de Limpeza</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px] pointer-events-none">R$</span>
                                <Input id="cleaningFee" type="number" step="0.01" {...register('cleaningFee')} className="h-12 rounded-xl pl-12 bg-slate-50 border-zinc-200" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Dados de Patrimônio ── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                            <Plus className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.15em]">Patrimônio & Rastreabilidade</h4>
                            <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Números de série e etiquetas físicas</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="assetTag" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Nº Patrimônio (Opcional)</Label>
                            <Input id="assetTag" {...register('assetTag')} placeholder="Ex: LOC-001" className="h-12 rounded-xl bg-slate-50 border-zinc-200" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serialNumber" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Nº de Série (Opcional)</Label>
                            <Input id="serialNumber" {...register('serialNumber')} placeholder="Ex: SN-8829-BZ" className="h-12 rounded-xl bg-slate-50 border-zinc-200" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="brand" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Marca</Label>
                            <Input id="brand" {...register('brand')} placeholder="DeWalt, Bosch, etc" className="h-12 rounded-xl bg-slate-50 border-zinc-200" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="model" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Modelo / Especificação</Label>
                            <Input id="model" {...register('model')} placeholder="Ex: DWE4212-B2" className="h-12 rounded-xl bg-slate-50 border-zinc-200" />
                        </div>
                    </div>
                </div>

                {/* ── Aquisição e Notas ── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                            <Loader2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-bold text-zinc-900 uppercase tracking-[0.15em]">Controladoria & Notas</h4>
                            <p className="text-[10px] text-zinc-500 font-medium tracking-tight">Custo de aquisição e manutenções</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionCost" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Custo de Aquisição</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-[10px] pointer-events-none">R$</span>
                                <Input id="acquisitionCost" type="number" step="0.01" {...register('acquisitionCost')} className="h-12 rounded-xl pl-12 bg-slate-50 border-zinc-200" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="acquisitionDate" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Data de Entrada</Label>
                            <Input id="acquisitionDate" type="date" {...register('acquisitionDate')} className="h-12 rounded-xl bg-slate-50 border-zinc-200" />
                        </div>
                        <div className="col-span-full space-y-2">
                            <Label htmlFor="notes" className="text-[11px] font-bold text-zinc-700 uppercase tracking-widest ml-1">Observações Técnicas</Label>
                            <textarea
                                id="notes"
                                {...register('notes')}
                                className="w-full min-h-[120px] p-5 rounded-2xl bg-slate-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 text-foreground transition-all"
                                placeholder="Detalhes sobre garantia, acessórios inclusos ou estado atual..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-10 border-t border-zinc-100">
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-[0.2em] text-[11px] h-14 px-10 rounded-2xl shadow-premium active:scale-95 transition-all w-full md:w-auto"
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-3 animate-spin" />}
                    {initialData ? 'Atualizar Registro' : 'Integralizar na Frota'}
                </Button>
            </div>
        </form>
    );
}
