'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    MessageSquare, Bell, Clock, DollarSign, Save,
    Send, CheckCircle2, AlertCircle, Info, Zap,
    ChevronRight, Settings2, Sparkles, Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn, formatCurrency } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

const automationSchema = z.object({
    whatsappEnabled: z.boolean(),
    notifyOnDueDate: z.boolean(),
    daysAfterDue: z.number().int().min(0),
    finePerDay: z.number().min(0),
    messageTemplate: z.string().min(10, 'O template deve ser mais descritivo'),
});

type AutomationValues = z.infer<typeof automationSchema>;

export default function AutomationPage() {
    const [isTestLoading, setIsTestLoading] = useState(false);

    // 1. Fetch current settings
    const { data: settings, isLoading, refetch } = useQuery({
        queryKey: ['automation-settings'],
        queryFn: async () => {
            const res = await api.get('/automation/settings');
            return res.data.data;
        }
    });

    // 2. Save mutation
    const saveMutation = useMutation({
        mutationFn: (data: AutomationValues) => api.patch('/automation/settings', data),
        onSuccess: () => {
            toast.success('Configurações salvas com sucesso!');
            refetch();
        },
        onError: () => toast.error('Erro ao salvar as configurações.')
    });

    const { register, handleSubmit, setValue, watch, formState: { errors, isDirty } } = useForm<AutomationValues>({
        resolver: zodResolver(automationSchema),
        values: settings ? {
            whatsappEnabled: settings.whatsappEnabled,
            notifyOnDueDate: settings.notifyOnDueDate,
            daysAfterDue: settings.daysAfterDue,
            finePerDay: Number(settings.finePerDay),
            messageTemplate: settings.messageTemplate,
        } : undefined
    });

    const whatsappEnabled = watch('whatsappEnabled');
    const notifyOnDueDate = watch('notifyOnDueDate');

    // 3. Test message action
    const handleTestMessage = async () => {
        const phone = window.prompt('Digite o número de WhatsApp para o teste (ex: 5511999999999):');
        if (!phone) return;

        setIsTestLoading(true);
        try {
            await api.post('/automation/test-message', {
                phone,
                message: watch('messageTemplate')
                    .replace('{{nome}}', 'João Cliente')
                    .replace('{{ferramenta}}', 'Martelete Rompedor')
                    .replace('{{dias}}', '3')
                    .replace('{{multa}}', formatCurrency(watch('finePerDay') * 3))
            });
            toast.success('Mensagem de teste enviada para o console do servidor!');
        } catch (error) {
            toast.error('Erro ao enviar mensagem de teste.');
        } finally {
            setIsTestLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8 p-8">
                <Skeleton className="h-20 w-full rounded-3xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Skeleton className="h-[400px] rounded-3xl" />
                    <Skeleton className="h-[400px] rounded-3xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-violet-500">
                        <Zap className="w-4 h-4 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">SaaS Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Automação de Cobrança</h1>
                    <p className="text-zinc-500 text-sm font-medium">Configure as réguas de notificação e multas automáticas via WhatsApp.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleTestMessage}
                        disabled={isTestLoading}
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-700 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all"
                    >
                        {isTestLoading ? <Wand2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Mensagem de Teste
                    </button>
                    <button
                        onClick={handleSubmit((data: AutomationValues) => saveMutation.mutate(data))}
                        disabled={saveMutation.isPending || !isDirty}
                        className={cn(
                            "flex items-center gap-2 px-8 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-premium",
                            isDirty
                                ? "bg-violet-600 text-white hover:bg-violet-700 hover:scale-[1.02]"
                                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                        )}
                    >
                        {saveMutation.isPending ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Configurações
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Settings Form */}
                <div className="lg:col-span-7 space-y-8">
                    {/* Active Toggle Card */}
                    <Card glass className="border-none overflow-hidden relative group">
                        <div className={cn(
                            "absolute inset-0 bg-gradient-to-br transition-opacity duration-1000",
                            whatsappEnabled ? "from-emerald-500/10 to-violet-600/5 opacity-100" : "from-zinc-100 to-zinc-50 opacity-100"
                        )} />

                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            whatsappEnabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-zinc-200 text-zinc-400"
                                        )}>
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Status do WhatsApp</h3>
                                    </div>
                                    <p className="text-xs text-zinc-500 font-medium pl-13">Habilite ou desabilite o envio automático global.</p>
                                </div>

                                <button
                                    onClick={() => setValue('whatsappEnabled', !whatsappEnabled, { shouldDirty: true })}
                                    className={cn(
                                        "w-14 h-8 rounded-full transition-all duration-500 relative flex items-center px-1",
                                        whatsappEnabled ? "bg-emerald-500" : "bg-zinc-300"
                                    )}
                                >
                                    <motion.div
                                        animate={{ x: whatsappEnabled ? 24 : 0 }}
                                        className="w-6 h-6 bg-white rounded-full shadow-md"
                                    />
                                </button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Rule Settings */}
                    <Card glass className="border-none">
                        <CardContent className="p-8 space-y-8">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings2 className="w-5 h-5 text-violet-600" />
                                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Regras de Negócio</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                                            <Bell className="w-4 h-4 text-violet-600" />
                                        </div>
                                        <Label className="text-[10px] uppercase font-black text-zinc-400 tracking-widest leading-none">Notificação Imediata</Label>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                                        <span className="text-xs font-bold text-zinc-600">Avisar no dia do vencimento</span>
                                        <Checkbox
                                            checked={notifyOnDueDate}
                                            onCheckedChange={(val) => setValue('notifyOnDueDate', !!val, { shouldDirty: true })}
                                            className="w-5 h-5 rounded-lg"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center">
                                            <Clock className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <Label className="text-[10px] uppercase font-black text-zinc-400 tracking-widest leading-none">Carência de Cobrança</Label>
                                    </div>
                                    <div className="space-y-2">
                                        <Input
                                            type="number"
                                            {...register('daysAfterDue', { valueAsNumber: true })}
                                            className="h-12 bg-zinc-50 border-zinc-100 rounded-xl font-bold"
                                            placeholder="Ex: 1"
                                        />
                                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Dias após vencimento para notificar</p>
                                    </div>
                                </div>

                                <div className="space-y-4 md:col-span-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                            <DollarSign className="w-4 h-4 text-amber-500" />
                                        </div>
                                        <Label className="text-[10px] uppercase font-black text-zinc-400 tracking-widest leading-none">Multa Diária (Penalty)</Label>
                                    </div>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...register('finePerDay', { valueAsNumber: true })}
                                            className="h-14 pl-12 bg-zinc-50 border-zinc-100 rounded-2xl font-black text-lg text-amber-600"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">R$</span>
                                        <p className="mt-3 text-[10px] text-zinc-400 font-medium leading-relaxed">
                                            <span className="text-amber-500 font-bold">Importante:</span> Esta multa será exibida na mensagem e calculada no fechamento da locação (Checkout).
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Template Editor */}
                <div className="lg:col-span-5 space-y-8">
                    <Card glass className="border-none min-h-full flex flex-col">
                        <CardContent className="p-8 flex-1 flex flex-col space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-100">
                                        <Wand2 className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Template Inteligente</h3>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-600 rounded-lg text-[9px] font-bold uppercase tracking-widest">
                                    <Sparkles className="w-3 h-3" /> AI Ready
                                </div>
                            </div>

                            <div className="space-y-2 flex-1 flex flex-col">
                                <Textarea
                                    {...register('messageTemplate')}
                                    className="flex-1 min-h-[200px] bg-zinc-950 text-emerald-400 font-mono text-xs leading-relaxed p-6 rounded-3xl border-none focus-visible:ring-1 focus-visible:ring-emerald-500/30 selection:bg-emerald-500/30"
                                    placeholder="Escreva sua mensagem aqui..."
                                />
                                {errors.messageTemplate && <p className="text-[9px] text-red-500 font-bold mt-2">{errors.messageTemplate.message}</p>}
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Variáveis Disponíveis</p>
                                <div className="flex flex-wrap gap-2">
                                    {['nome', 'ferramenta', 'dias', 'multa'].map((tag) => (
                                        <button
                                            key={tag}
                                            type="button"
                                            onClick={() => {
                                                const current = watch('messageTemplate');
                                                setValue('messageTemplate', `${current} {{${tag}}}`, { shouldDirty: true });
                                            }}
                                            className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl text-[10px] font-bold transition-all border border-zinc-200"
                                        >
                                            {`{{${tag}}}`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Preview Mockup */}
                            <div className="mt-8 p-6 rounded-3xl bg-emerald-50/30 border border-emerald-50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3">
                                    <MessageSquare className="w-4 h-4 text-emerald-600 opacity-20" />
                                </div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3" /> Preview da Cobrança
                                </p>
                                <p className="text-[11px] text-zinc-600 leading-relaxed italic pr-6 h-12 overflow-hidden overflow-ellipsis">
                                    {watch('messageTemplate')
                                        .replace('{{nome}}', 'João Cliente')
                                        .replace('{{ferramenta}}', 'Martelete')
                                        .replace('{{dias}}', '3')
                                        .replace('{{multa}}', 'R$ 150,00')}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Warning Section */}
            <div className="px-4">
                <div className="flex items-start gap-4 p-8 rounded-[32px] bg-amber-500 text-white shadow-xl shadow-amber-100 relative overflow-hidden">
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="relative z-10 space-y-2">
                        <h4 className="text-xl font-bold tracking-tight">Segurança de Envios (Anti-Spam)</h4>
                        <p className="text-sm font-medium text-white/90 max-w-2xl leading-relaxed">
                            O FROTEX nunca enviará mais de uma notificação por dia para o mesmo contrato, mesmo que o sistema seja reiniciado.
                            As mensagens são disparadas automaticamente às **09:00 AM** todos os dias.
                        </p>
                    </div>
                    <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 blur-[80px] rounded-full" />
                </div>
            </div>
        </div>
    );
}
