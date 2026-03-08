import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Loader2, Plus, Trash2, Calculator, Info,
    ChevronRight, ChevronLeft, CheckCircle2,
    Calendar, User, Wrench, FileText, Percent,
    Clock, Landmark
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const quoteSchema = z.object({
    customerId: z.string().uuid('Selecione um cliente'),
    startDate: z.string().min(1, 'Início obrigatório'),
    endDateExpected: z.string().min(1, 'Retorno obrigatório'),
    validUntil: z.string().optional(),
    rentalType: z.enum(['daily', 'weekly', 'monthly', 'custom']).default('daily'),
    items: z.array(z.object({
        toolId: z.string().uuid('Selecione um equipamento'),
        quantity: z.number().int().min(1).default(1),
        dailyRate: z.coerce.number().min(0),
        discountType: z.enum(['fixed', 'percentage']).default('fixed'),
        discountValue: z.coerce.number().min(0).default(0),
    })).min(1, 'Adicione pelo menos um item'),
    totalDiscount: z.coerce.number().min(0).default(0),
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
    const [step, setStep] = useState(1);
    const { register, handleSubmit, formState: { errors }, setValue, watch, control, trigger } = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema) as any,
        defaultValues: {
            customerId: initialData?.customerId || '',
            startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            endDateExpected: initialData?.endDateExpected ? new Date(initialData.endDateExpected).toISOString().split('T')[0] : '',
            validUntil: initialData?.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
            rentalType: initialData?.rentalType || 'daily',
            items: initialData?.items?.map((item: any) => ({
                toolId: item.toolId,
                quantity: item.quantity,
                dailyRate: parseFloat(item.dailyRate),
                discountType: item.discountType || 'fixed',
                discountValue: parseFloat(item.discountValue || '0'),
            })) || [{ toolId: '', quantity: 1, dailyRate: 0, discountType: 'fixed', discountValue: 0 }],
            totalDiscount: initialData?.totalDiscount ? parseFloat(initialData.totalDiscount) : 0,
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
    const customerId = watch('customerId');

    const selectedCustomer = customers?.find((c: any) => c.id === customerId);

    const days = (() => {
        if (!startDate || !endDateExpected) return 0;
        const start = new Date(startDate);
        const end = new Date(endDateExpected);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

        // Reset hours for accurate day-to-day comparison
        const d1 = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const d2 = new Date(end.getFullYear(), end.getMonth(), end.getDate());

        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // At least 1 day for billing, unless it's a future draft
        return Math.max(1, diffDays);
    })();

    const itemsCalculations = (watchedItems || []).map(item => {
        const itemDailyRate = parseFloat(item?.dailyRate?.toString() || '0');
        const itemQuantity = parseInt(item?.quantity?.toString() || '1');
        const itemBase = itemDailyRate * itemQuantity * days;

        let itemDiscount = 0;
        const discountVal = parseFloat(item?.discountValue?.toString() || '0');

        if (item.discountType === 'percentage') {
            itemDiscount = itemBase * (discountVal / 100);
        } else {
            itemDiscount = discountVal;
        }

        const itemTotal = Math.max(0, itemBase - itemDiscount);
        return {
            base: itemBase,
            discount: itemDiscount,
            total: itemTotal
        };
    });

    const subtotal = itemsCalculations.reduce((acc, curr) => acc + curr.total, 0);
    const total = Math.max(0, subtotal - parseFloat(totalDiscount?.toString() || '0'));

    const nextStep = async () => {
        let fieldsToValidate: any[] = [];
        if (step === 1) fieldsToValidate = ['customerId', 'startDate', 'endDateExpected', 'rentalType'];
        if (step === 2) {
            // Validate all items have toolId
            fieldsToValidate = ['items'];
        }

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(s => Math.min(s + 1, 3));
        else toast.error('Preencha todos os campos obrigatórios corretamente');
    };

    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-8 px-2">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                            step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-zinc-100 text-zinc-400"
                        )}>
                            {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest hidden md:block",
                            step === s ? "text-primary" : "text-zinc-400"
                        )}>
                            {s === 1 ? 'Cliente & Logística' : s === 2 ? 'Itens & Descontos' : 'Finalização'}
                        </span>
                        {s < 3 && <div className="w-12 h-[2px] bg-zinc-100 mx-2" />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="bg-zinc-50/50 p-6 rounded-3xl border border-zinc-100 space-y-6">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Cliente Solicitante
                                    </Label>
                                    <Select onValueChange={(v) => setValue('customerId', v)} defaultValue={customerId}>
                                        <SelectTrigger className="h-12 rounded-xl bg-white border-zinc-200">
                                            <SelectValue placeholder="Selecione o parceiro comercial" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers?.map((c: any) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    <div className="flex flex-col items-start py-0.5">
                                                        <span className="font-bold text-sm">{c.fullName}</span>
                                                        <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-tighter">{c.documentNumber} • {c.addressCity}/{c.addressState}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.customerId && <p className="text-[10px] text-red-500 font-bold uppercase ml-1">{errors.customerId.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Calendar className="w-3 h-3" /> Início da Operação
                                        </Label>
                                        <Input type="date" className="h-12 rounded-xl bg-white border-zinc-200" {...register('startDate')} />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Clock className="w-3 h-3" /> Retorno Estimado
                                        </Label>
                                        <Input type="date" className="h-12 rounded-xl bg-white border-zinc-200" {...register('endDateExpected')} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Calendar className="w-3 h-3 text-emerald-500" /> Validade da Proposta
                                        </Label>
                                        <Input type="date" className="h-12 rounded-xl bg-white border-zinc-200" {...register('validUntil')} />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Landmark className="w-3 h-3" /> Modalidade de Cobrança
                                        </Label>
                                        <Select onValueChange={(v: any) => setValue('rentalType', v)} defaultValue={watch('rentalType')}>
                                            <SelectTrigger className="h-12 rounded-xl bg-white border-zinc-200">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="daily">Diário (Padrão)</SelectItem>
                                                <SelectItem value="weekly">Semanal</SelectItem>
                                                <SelectItem value="monthly">Mensal</SelectItem>
                                                <SelectItem value="custom">Personalizado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-zinc-900">Configuração de Itens</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ toolId: '', quantity: 1, dailyRate: 0, discountType: 'fixed', discountValue: 0 })}
                                    className="rounded-full gap-2 border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-bold uppercase tracking-widest"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar Equipamento
                                </Button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-premium">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="p-5 bg-white border border-zinc-200 rounded-3xl space-y-4 hover:border-primary/20 transition-all group relative">
                                        <div className="grid grid-cols-12 gap-4">
                                            <div className="col-span-12 md:col-span-6 space-y-2">
                                                <Label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 ml-1">Equipamento</Label>
                                                <Select
                                                    onValueChange={(v) => {
                                                        setValue(`items.${index}.toolId`, v);
                                                        const tool = tools?.find((t: any) => t.id === v);
                                                        if (tool) setValue(`items.${index}.dailyRate`, parseFloat(tool.dailyRate));
                                                    }}
                                                    defaultValue={field.toolId}
                                                >
                                                    <SelectTrigger className="h-10 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold text-sm">
                                                        <SelectValue placeholder="Busque pelo ativo..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tools?.map((t: any) => (
                                                            <SelectItem key={t.id} value={t.id}>{t.name} ({t.assetTag})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="col-span-4 md:col-span-2 space-y-2">
                                                <Label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 ml-1">Qtd</Label>
                                                <Input type="number" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-10 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold text-center tabular-nums" />
                                            </div>

                                            <div className="col-span-8 md:col-span-4 space-y-2">
                                                <Label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 ml-1 text-right block">Valor Unit.</Label>
                                                <div className="relative">
                                                    <Input type="number" step="0.01" {...register(`items.${index}.dailyRate`, { valueAsNumber: true })} className="h-10 rounded-xl bg-zinc-50/50 border-zinc-100 font-bold text-right pr-4 text-violet-600 tabular-nums" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 pt-2 border-t border-zinc-50">
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Percent className="w-3.5 h-3.5 text-zinc-300" />
                                                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Desconto Item:</span>
                                            </div>
                                            <div className="flex flex-1 items-center gap-3">
                                                <Select onValueChange={(v: any) => setValue(`items.${index}.discountType`, v)} defaultValue={field.discountType}>
                                                    <SelectTrigger className="h-8 w-24 rounded-lg bg-zinc-50 border-none text-[10px] font-bold uppercase tracking-widest">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fixed">R$ Fixo</SelectItem>
                                                        <SelectItem value="percentage">% Perc.</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input type="number" step="0.01" {...register(`items.${index}.discountValue`, { valueAsNumber: true })} className="h-8 flex-1 rounded-lg bg-zinc-50 border-none font-bold text-xs tabular-nums" />
                                            </div>
                                            <button type="button" onClick={() => remove(index)} className="p-2 text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-5">
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <FileText className="w-3 h-3" /> Termos & Condições
                                        </Label>
                                        <Textarea
                                            {...register('termsAndConditions')}
                                            placeholder="Ex: Entrega inclusa num raio de 20km..."
                                            className="min-h-[120px] rounded-3xl bg-zinc-50/50 border-zinc-100 resize-none text-xs leading-relaxed"
                                        />
                                    </div>
                                    <div className="space-y-2.5">
                                        <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                                            <Info className="w-3 h-3" /> Notas Internas
                                        </Label>
                                        <Textarea
                                            {...register('notes')}
                                            placeholder="Anotações para a equipe administrativa..."
                                            className="min-h-[80px] rounded-3xl bg-zinc-50/50 border-zinc-100 resize-none text-xs leading-relaxed"
                                        />
                                    </div>
                                </div>

                                <div className="bg-zinc-900 rounded-[40px] p-8 text-white relative overflow-hidden shadow-premium h-full flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 blur-[90px] rounded-full -translate-y-1/2 translate-x-1/2" />

                                    <div className="space-y-6 relative z-10">
                                        <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-500">
                                            <span>Consolidado da Proposta</span>
                                            <span className="text-primary">{days} {days === 1 ? 'DIA' : 'DIAS'}</span>
                                        </div>

                                        {/* Items Review List */}
                                        <div className="space-y-3 max-h-[180px] overflow-y-auto pr-2 scrollbar-premium">
                                            {watchedItems?.map((item, idx) => {
                                                const tool = tools?.find((t: any) => t.id === item.toolId);
                                                const calc = itemsCalculations[idx];
                                                if (!tool) return null;
                                                return (
                                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] font-bold text-zinc-100">{tool.name}</span>
                                                            <span className="text-[9px] text-zinc-500 font-bold uppercase">{item.quantity} un × {formatCurrency(item.dailyRate)}/dia</span>
                                                        </div>
                                                        <div className="text-right">
                                                            {calc?.discount > 0 && (
                                                                <span className="text-[9px] text-zinc-500 line-through block italic">{formatCurrency(calc.base)}</span>
                                                            )}
                                                            <span className="text-xs font-bold text-white tabular-nums">{formatCurrency(calc?.total || 0)}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="space-y-3 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm mt-4">
                                            <div className="flex justify-between items-center text-xs text-zinc-400">
                                                <span>Subtotal de Ativos</span>
                                                <span className="font-bold tabular-nums text-white text-sm">{formatCurrency(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs text-zinc-400 pt-2 border-t border-white/5">
                                                <span className="flex items-center gap-2">Desconto Global <Plus className="w-3 h-3 rotate-45" /></span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-zinc-600">BRL</span>
                                                    <input
                                                        type="number"
                                                        {...register('totalDiscount', { valueAsNumber: true })}
                                                        className="w-24 bg-transparent border-b border-white/10 focus:border-primary focus:outline-none text-right font-extrabold text-white tabular-nums h-8 text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 flex justify-between items-end border-t border-white/5 mt-4">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-extrabold text-primary uppercase tracking-[0.4em]">VALOR TOTAL</p>
                                            <p className="text-[10px] text-zinc-500 italic">Pronto para envio</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-5xl font-black tracking-tighter bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent italic">
                                                {formatCurrency(total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    disabled={step === 1}
                    className="rounded-xl gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
                >
                    <ChevronLeft className="w-4 h-4" /> Voltar
                </Button>

                {step < 3 ? (
                    <Button
                        type="button"
                        onClick={nextStep}
                        className="rounded-xl gap-2 px-8 h-12 bg-zinc-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-zinc-200"
                    >
                        Próximo Passo <ChevronRight className="w-4 h-4" />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-xl gap-3 px-10 h-14 bg-primary hover:bg-primary/90 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-4.5 h-4.5" />}
                        Finalizar & Gerar
                    </Button>
                )}
            </div>
        </form>
    );
}
