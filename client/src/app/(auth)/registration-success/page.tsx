'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

function RegistrationSuccessContent() {
    const searchParams = useSearchParams();
    const emailParam = searchParams.get('email');
    const email = emailParam || '';
    const [isResending, setIsResending] = useState(false);
    const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleResend = async () => {
        if (isResending || !email) return;
        console.log('📧 [FRONTEND] Attempting to resend verification to:', email);
        setIsResending(true);
        setResendStatus('idle');
        setErrorMessage('');
        try {
            const response = await api.post('/auth/resend-verification', { email });
            console.log('✅ [FRONTEND] Resend response:', response.data);
            setResendStatus('success');
            setTimeout(() => setResendStatus('idle'), 5000);
        } catch (err: any) {
            console.error('❌ [FRONTEND] Resend failed:', err.response?.data || err.message);
            setResendStatus('error');
            setErrorMessage(err.response?.data?.message || 'Erro ao reenviar. Tente novamente.');
            setTimeout(() => setResendStatus('idle'), 8000);
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="w-full max-w-md relative z-10 flex flex-col items-center">

            {/* 1. Brand Logo - Above the container */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <Link href="/">
                    <div className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95">
                        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:bg-violet-600 transition-colors">L</div>
                        <span className="text-2xl font-black italic tracking-tighter font-outfit">Locattus<span className="text-violet-600 not-italic">.</span></span>
                    </div>
                </Link>
            </motion.div>

            {/* 2. Main Container Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full bg-white border border-slate-100 rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden flex flex-col items-center text-center space-y-8"
            >
                {/* Icon decoration */}
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-50/50 rounded-full blur-3xl opacity-50" />

                {/* Email Icon */}
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-violet-50 rounded-[2.5rem] flex items-center justify-center border border-violet-100 shadow-xl shadow-violet-50">
                        <Mail className="w-10 h-10 text-violet-600 stroke-[1.5px]" />
                    </div>
                </div>

                {/* Text Body - Now inside the card */}
                <div className="space-y-4 relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter text-slate-950 leading-tight font-outfit">
                        Verifique sua <br />
                        <span className="text-violet-600 italic">Caixa de Entrada.</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-base leading-relaxed max-w-[280px] mx-auto">
                        {email ? (
                            <>
                                Um e-mail de verificação foi enviado para o e-mail <br />
                                <span className="font-bold text-slate-900 break-all">{email}</span>.
                            </>
                        ) : (
                            "Um e-mail de verificação foi enviado para o seu e-mail profissional."
                        )}
                    </p>
                </div>

                {/* Resend Link - Functional */}
                <div className="pt-4 border-t border-slate-50 w-full relative z-10">
                    <p className="text-sm text-slate-400 font-medium mb-3">
                        Não recebeu o código?
                    </p>
                    <button
                        onClick={handleResend}
                        disabled={isResending || !email}
                        className={`w-full py-4 font-black text-xs uppercase tracking-widest transition-all border rounded-2xl flex items-center justify-center gap-2 group ${!email
                            ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                            : 'text-violet-600 border-violet-100 hover:bg-violet-50'
                            }`}
                    >
                        {isResending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : resendStatus === 'success' ? (
                            <><CheckCircle2 className="w-4 h-4" /> Link Reenviado!</>
                        ) : !email ? (
                            'E-mail não identificado'
                        ) : (
                            'Reenviar Link de Ativação'
                        )}
                    </button>
                    <AnimatePresence>
                        {resendStatus === 'error' && (
                            <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest leading-tight"
                            >
                                {errorMessage}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>

                {/* Secondary Tip - Purple Icon */}
                <div className="flex items-start gap-4 text-left p-5 bg-violet-50/30 border border-violet-100/50 rounded-[2rem] w-full relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                        <Zap className="w-4 h-4 text-violet-600 fill-violet-600" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="text-[9px] font-black text-violet-900 uppercase tracking-widest">Atenção</h4>
                        <p className="text-[11px] text-slate-500 font-medium leading-tight">
                            Verifique sua pasta de <b>Spam</b> ou Lixo Eletrônico se não encontrar.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* 3. Footer Back Link - Outside the card */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-10"
            >
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-950 transition-all font-bold text-[10px] uppercase tracking-[0.3em] group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para o Início
                </Link>
            </motion.div>
        </div>
    );
}

export default function RegistrationSuccessPage() {
    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-6 font-inter text-slate-900 relative overflow-hidden selection:bg-violet-100">
            {/* Premium Background Grid & Blobs */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#7c3aed 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/5 rounded-full blur-[120px]" />
            </div>

            <Suspense fallback={<Loader2 className="w-10 h-10 animate-spin text-violet-600" />}>
                <RegistrationSuccessContent />
            </Suspense>

            {/* Micro branding */}
            <div className="absolute bottom-8 text-center w-full opacity-30">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
                    LOCATTUS — SECURITY INFRASTRUCTURE
                </p>
            </div>
        </div>
    );
}
