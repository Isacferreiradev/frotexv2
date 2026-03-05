'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, Sparkles, AlertCircle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';

export default function VerifyPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando sua identidade...');
    const verificationStarted = useRef(false);

    useEffect(() => {
        if (!token || verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;

        const verifyEmail = async () => {
            try {
                const res = await api.get(`/auth/verify?token=${token}`);
                setStatus('success');
                setMessage(res.data.data?.message || 'E-mail verificado com sucesso!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'O link de verificação é inválido ou expirou.');
            }
        };

        verifyEmail();
    }, [token]);

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

            <div className="w-full max-w-md space-y-10 text-center relative z-10">
                {/* Brand Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-12"
                >
                    <Link href="/">
                        <div className="flex items-center gap-2 group cursor-pointer animate-in fade-in duration-1000">
                            <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg">L</div>
                            <span className="text-2xl font-extrabold italic tracking-tight font-outfit">Locattus<span className="text-violet-600 not-italic">.</span></span>
                        </div>
                    </Link>
                </motion.div>

                <AnimatePresence mode="wait">
                    {status === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-8"
                        >
                            <div className="flex justify-center">
                                <div className="w-24 h-24 bg-white shadow-2xl shadow-violet-100 rounded-[2.5rem] flex items-center justify-center border border-slate-50 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-violet-50 animate-pulse" />
                                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin relative z-10 stroke-[1.5px]" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 font-outfit">Autenticando...</h1>
                                <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                                    Sua identidade está sendo processada através dos nossos protocolos de segurança.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 bg-white shadow-2xl shadow-emerald-100 rounded-[2.5rem] flex items-center justify-center border border-slate-50">
                                        <ShieldCheck className="w-12 h-12 text-emerald-500 stroke-[1.5px]" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full shadow-lg shadow-emerald-100 italic">
                                        <Sparkles className="w-3 h-3" /> Verificado
                                    </div>
                                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 leading-[0.9] font-outfit">
                                        Identidade <br />
                                        <span className="text-violet-600 italic">Confirmada.</span>
                                    </h1>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                                        Sua jornada na Locattus começa agora. Tudo pronto para escalar.
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/login"
                                className="w-full py-6 bg-slate-950 hover:bg-violet-700 text-white font-extrabold rounded-3xl transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 group text-xs uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4 duration-700"
                            >
                                Acessar Plataforma <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="space-y-6">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 bg-white shadow-2xl shadow-red-100 rounded-[2.5rem] flex items-center justify-center border border-slate-50">
                                        <AlertCircle className="w-12 h-12 text-red-500 stroke-[1.5px]" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 text-red-600 text-[10px] font-extrabold uppercase tracking-[0.2em] rounded-full border border-red-100">
                                        FALLBACK
                                    </div>
                                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-950 leading-[0.9] font-outfit">
                                        Erro de <br />
                                        <span className="text-red-600 italic">Verificação.</span>
                                    </h1>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Link
                                    href="/register"
                                    className="w-full py-6 bg-slate-950 hover:bg-slate-800 text-white font-extrabold rounded-3xl transition-all shadow-2xl flex items-center justify-center gap-3 group text-xs uppercase tracking-[0.2em]"
                                >
                                    Solicitar Novo Link <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                                    Tokens de segurança expiram em 24h
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Micro branding */}
            <div className="absolute bottom-10 text-center w-full opacity-30">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.4em]">
                    LOCATTUS SECURITY PROTOCOLS © 2026
                </p>
            </div>
        </div>
    );
}
