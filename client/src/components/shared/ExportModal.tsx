'use client';

import { useState } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
    Download, FileText, Table as TableIcon, Calendar,
    Wrench, Users, FileStack, DollarSign, Loader2, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const MODULES = [
    { id: 'tools', label: 'Equipamentos', icon: Wrench, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'customers', label: 'Clientes', icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { id: 'rentals', label: 'Locações', icon: FileStack, color: 'text-violet-500', bg: 'bg-violet-50' },
    { id: 'finance', label: 'Financeiro', icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-50' },
];

const PERIODS = [
    { id: '7d', label: 'Últimos 7 dias' },
    { id: '30d', label: 'Últimos 30 dias' },
    { id: '90d', label: 'Últimos 90 dias' },
    { id: 'all', label: 'Todo o histórico' },
];

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
    const [module, setModule] = useState<string>('tools');
    const [period, setPeriod] = useState<string>('30d');
    const [format, setFormat] = useState<'csv' | 'pdf'>('pdf');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleExport = async () => {
        setIsLoading(true);
        try {
            // Calcular datas com base no período selecionado
            let startDate = "";
            const now = new Date();
            if (period === '7d') startDate = new Date(now.getTime() - 7 * 86400000).toISOString();
            if (period === '30d') startDate = new Date(now.getTime() - 30 * 86400000).toISOString();
            if (period === '90d') startDate = new Date(now.getTime() - 90 * 86400000).toISOString();

            const response = await api.post('/export', {
                module,
                format,
                startDate,
                endDate: now.toISOString()
            }, { responseType: 'blob' });

            const blob = new Blob([response.data], {
                type: format === 'csv' ? 'text/csv' : 'application/pdf'
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `export-${module}-${new Date().toISOString().split('T')[0]}.${format}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsSuccess(true);
            toast.success("Exportação concluída com sucesso!");

            setTimeout(() => {
                setIsSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar exportação. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] border-none bg-white/95 backdrop-blur-xl shadow-2xl p-0 overflow-hidden rounded-[32px]">
                <div className="h-2 w-full bg-gradient-to-r from-primary via-violet-500 to-indigo-500" />

                <div className="p-8">
                    <DialogHeader className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                                <Download className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-2xl font-bold font-jakarta text-foreground">Centro de Exportação</DialogTitle>
                        </div>
                        <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                            Selecione o módulo e o período desejado para extrair seus dados em formatos profissionais.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-8">
                        {/* Module Selection */}
                        <div className="space-y-4">
                            <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">1. O que você deseja exportar?</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {MODULES.map((m) => {
                                    const Icon = m.icon;
                                    const isSelected = module === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setModule(m.id)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-300 text-left group",
                                                isSelected
                                                    ? "border-primary bg-primary/5 shadow-sm"
                                                    : "border-zinc-100 hover:border-zinc-200 bg-zinc-50/50"
                                            )}
                                        >
                                            <div className={cn("p-2 rounded-xl transition-all", m.bg, m.color, isSelected && "scale-110")}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-primary" : "text-zinc-600")}>
                                                {m.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Period & Format */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">2. Período</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger className="h-12 rounded-xl border-zinc-200 focus:ring-primary/20 transition-all font-medium text-xs">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-zinc-400" />
                                            <SelectValue />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                                        {PERIODS.map(p => (
                                            <SelectItem key={p.id} value={p.id} className="text-xs font-semibold py-3 focus:bg-primary/5 focus:text-primary rounded-lg mx-1 my-0.5">
                                                {p.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">3. Formato</Label>
                                <div className="flex bg-zinc-100/80 p-1 rounded-xl">
                                    <button
                                        onClick={() => setFormat('pdf')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all",
                                            format === 'pdf' ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        )}
                                    >
                                        <FileText className="w-3.5 h-3.5" /> PDF
                                    </button>
                                    <button
                                        onClick={() => setFormat('csv')}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-widest transition-all",
                                            format === 'csv' ? "bg-white text-primary shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                                        )}
                                    >
                                        <TableIcon className="w-3.5 h-3.5" /> CSV
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="rounded-xl px-6 h-12 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
                    >
                        Cancelar
                    </Button>

                    <Button
                        onClick={handleExport}
                        disabled={isLoading}
                        className={cn(
                            "rounded-2xl h-14 px-10 gap-3 font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-500 shadow-2xl overflow-hidden relative",
                            isSuccess
                                ? "bg-emerald-500 hover:bg-emerald-500 text-white shadow-emerald-200"
                                : "bg-primary hover:bg-primary/90 text-white shadow-primary/20"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-3"
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando...
                                </motion.div>
                            ) : isSuccess ? (
                                <motion.div
                                    key="success"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-3"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                    Download Iniciado
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-3"
                                >
                                    <Download className="w-4.5 h-4.5" />
                                    Gerar Arquivo
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
