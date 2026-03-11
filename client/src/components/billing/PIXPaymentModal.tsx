'use client';

import { useState, useEffect } from 'react';
import {
    CheckCircle2,
    Copy,
    Clock,
    Zap,
    Loader2,
    AlertCircle,
    Check,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface PIXPaymentModalProps {
    charge: {
        id: string;
        amount: string;
        planRequested: string;
        brCode: string;
        brCodeBase64: string;
        expiresAt: string;
    };
    onSuccess: () => void;
    onClose: () => void;
}

export function PIXPaymentModal({ charge, onSuccess, onClose }: PIXPaymentModalProps) {
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
    const [isCopying, setIsCopying] = useState(false);

    // Calculate time left
    useEffect(() => {
        const expiry = new Date(charge.expiresAt).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((expiry - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0) {
                setStatus('expired');
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [charge.expiresAt]);

    // Polling for status
    useEffect(() => {
        if (status !== 'pending') return;

        const poll = setInterval(async () => {
            try {
                const response = await api.get(`/billing/charge/${charge.id}`);
                if (response.data?.data?.status === 'paid') {
                    setStatus('paid');
                    clearInterval(poll);
                    toast.success('Pagamento confirmado com sucesso!');
                    setTimeout(() => onSuccess(), 2000);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000); // Poll every 5 seconds

        return () => clearInterval(poll);
    }, [charge.id, status, onSuccess]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(charge.brCode);
        setIsCopying(true);
        toast.success('Código PIX copiado!');
        setTimeout(() => setIsCopying(false), 2000);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            Finalizar Assinatura
                        </h3>
                        <p className="text-zinc-400 text-sm">Plano {charge.planRequested.toUpperCase()}</p>
                    </div>
                    {status === 'pending' && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full text-xs font-mono text-zinc-300">
                            <Clock className="w-3 h-3 text-yellow-400" />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                </div>

                <div className="p-8 flex flex-col items-center">
                    {status === 'pending' ? (
                        <>
                            {/* QR Code */}
                            <div className="relative p-4 bg-white rounded-2xl mb-6 shadow-inner group">
                                <img
                                    src={charge.brCodeBase64}
                                    alt="PIX QR Code"
                                    className="w-48 h-48"
                                />
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                            </div>

                            <div className="text-center mb-8">
                                <p className="text-zinc-400 text-sm mb-1">Valor a pagar</p>
                                <p className="text-3xl font-black text-white">
                                    R$ {parseFloat(charge.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            </div>

                            {/* Copy & Paste */}
                            <div className="w-full space-y-3">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-1">
                                    Ou use o PIX Copia e Cola
                                </p>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-400 text-xs font-mono truncate">
                                        {charge.brCode}
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="bg-white text-black hover:bg-zinc-200 p-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-white/5"
                                    >
                                        {isCopying ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 flex items-center gap-3 text-zinc-500 text-xs bg-zinc-800/30 px-4 py-3 rounded-xl w-full">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Aguardando pagamento... o sistema atualizará automaticamente.
                            </div>
                        </>
                    ) : status === 'paid' ? (
                        <div className="py-10 text-center animate-in zoom-in fade-in duration-500">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-2">Pagamento Confirmado!</h4>
                            <p className="text-zinc-400 mb-8 max-w-[250px] mx-auto">
                                Seu plano foi atualizado. Aproveite todos os novos recursos do Locattus agora mesmo!
                            </p>
                            <button
                                onClick={onSuccess}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                Começar a usar <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="py-10 text-center animate-in zoom-in fade-in duration-500">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-2">QR Code Expirado</h4>
                            <p className="text-zinc-400 mb-8">
                                O tempo para pagamento expirou. Por favor, tente gerar uma nova cobrança.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all"
                            >
                                Voltar e tentar novamente
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                {status === 'pending' && (
                    <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl transition-all text-sm font-medium"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
