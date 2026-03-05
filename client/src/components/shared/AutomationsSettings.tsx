'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Bot, Loader2, QrCode, PowerOff, ShieldCheck, Phone, Zap } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export function AutomationsSettings() {
    const [qrCodeOpen, setQrCodeOpen] = useState(false);
    const [qrBase64, setQrBase64] = useState<string | null>(null);

    // Fetch Base Settings
    const { data: settings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
        queryKey: ['automation-settings'],
        queryFn: async () => {
            const res = await api.get('/automation/settings');
            return res.data.data;
        }
    });

    // Fetch Connection Status
    const { data: connectionStatus, refetch: refetchStatus } = useQuery({
        queryKey: ['whatsapp-status'],
        queryFn: async () => {
            const res = await api.get('/automation/whatsapp/status');
            return res.data.status;
        },
        refetchInterval: (query) => {
            // Poll every 3 seconds if we are supposedly trying to connect
            return (query.state.data === 'connecting' || qrCodeOpen) ? 3000 : false;
        }
    });

    const updateSettingsMut = useMutation({
        mutationFn: (data: any) => api.patch('/automation/settings', data),
        onSuccess: () => {
            toast.success('Configurações de automação salvas!');
            refetchSettings();
        }
    });

    const connectWhatsappMut = useMutation({
        mutationFn: () => api.post('/automation/whatsapp/connect'),
        onSuccess: (res) => {
            if (res.data.qr) {
                setQrBase64(res.data.qr);
                setQrCodeOpen(true);
            }
            refetchStatus();
        },
        onError: () => toast.error('Falha ao gerar QR Code.')
    });

    const disconnectWhatsappMut = useMutation({
        mutationFn: () => api.delete('/automation/whatsapp/disconnect'),
        onSuccess: () => {
            toast.success('WhatsApp desconectado.');
            setQrCodeOpen(false);
            setQrBase64(null);
            refetchStatus();
            refetchSettings();
        }
    });

    // If polling detects successful connection, close modal
    useEffect(() => {
        if (connectionStatus === 'connected' && qrCodeOpen) {
            setQrCodeOpen(false);
            setQrBase64(null);
            toast.success('WhatsApp conectado com sucesso!');
            refetchSettings();
        }
    }, [connectionStatus, qrCodeOpen, refetchSettings]);

    if (settingsLoading) {
        return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>;
    }

    const isConnected = connectionStatus === 'connected';

    return (
        <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Automação de WhatsApp</h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cobranças & Lembretes Automáticos</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Connection Card */}
                <div className="bg-zinc-50 rounded-[28px] p-8 border border-zinc-100 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                            isConnected ? "bg-emerald-500 shadow-emerald-200" : "bg-zinc-200"
                        )}>
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-zinc-900">
                                {isConnected ? 'Dispositivo Conectado' : 'Não conectado'}
                            </h4>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                                {isConnected ? 'Sincronizado e Operante' : 'Necessário Ler QR Code'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-200">
                        {!isConnected ? (
                            <button
                                onClick={() => connectWhatsappMut.mutate()}
                                disabled={connectWhatsappMut.isPending}
                                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {connectWhatsappMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                                Conectar Celular da Loja
                            </button>
                        ) : (
                            <button
                                onClick={() => disconnectWhatsappMut.mutate()}
                                disabled={disconnectWhatsappMut.isPending}
                                className="w-full py-4 bg-white border border-red-100 text-red-600 hover:bg-red-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                {disconnectWhatsappMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <PowerOff className="w-4 h-4" />}
                                Desconectar Aparelho
                            </button>
                        )}
                    </div>
                </div>

                {/* Settings Form */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[28px] p-8 border border-zinc-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-50">
                            <div>
                                <h4 className="font-bold text-sm text-zinc-900">Ativar Cobrança Automática</h4>
                                <p className="text-xs text-zinc-400 leading-relaxed mt-1">Lembretes proativos para aluguéis vencidos</p>
                            </div>
                            <Switch
                                checked={settings?.notifyOnDueDate}
                                onCheckedChange={(val: boolean) => updateSettingsMut.mutate({ notifyOnDueDate: val })}
                                disabled={!isConnected}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-zinc-400">Dias após Vencimento</Label>
                                <Input
                                    className="rounded-xl"
                                    type="number"
                                    defaultValue={settings?.daysAfterDue}
                                    onBlur={(e) => updateSettingsMut.mutate({ daysAfterDue: parseInt(e.target.value) })}
                                    disabled={!isConnected}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-zinc-400">Multa / Dia (R$)</Label>
                                <Input
                                    className="rounded-xl"
                                    type="number"
                                    step="0.01"
                                    defaultValue={settings?.finePerDay}
                                    onBlur={(e) => updateSettingsMut.mutate({ finePerDay: parseFloat(e.target.value) })}
                                    disabled={!isConnected}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Template da Mensagem</Label>
                            <textarea
                                className="w-full min-h-[100px] border border-zinc-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-violet-600 outline-none disabled:opacity-50"
                                defaultValue={settings?.messageTemplate}
                                onBlur={(e) => updateSettingsMut.mutate({ messageTemplate: e.target.value })}
                                disabled={!isConnected}
                            />
                            <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Variáveis: {'{{nome}}'}, {'{{ferramenta}}'}, {'{{dias}}'}, {'{{multa}}'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Code Modal Flow */}
            <Dialog open={qrCodeOpen} onOpenChange={setQrCodeOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-[32px] p-0 overflow-hidden text-center">
                    <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                        <DialogTitle className="font-bold text-lg tracking-tight">Leia o QR Code</DialogTitle>
                    </div>
                    <div className="p-8 space-y-6">
                        <p className="text-sm text-zinc-500">
                            Abra o WhatsApp no aparelho da loja, vá em <strong>Aparelhos Conectados</strong> e escaneie o código abaixo.
                        </p>

                        <div className="flex justify-center items-center h-[256px]">
                            {qrBase64 ? (
                                <img src={qrBase64} alt="WhatsApp Connection QR Code" className="w-[200px] h-[200px] rounded-xl shadow-lg border border-zinc-100" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-violet-600">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest">Gerando...</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-emerald-50 text-emerald-600 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-medium">
                            <ShieldCheck className="w-5 h-5" />
                            Aguardando leitura do código...
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
