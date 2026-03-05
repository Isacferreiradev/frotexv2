'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyPage() {
    const router = useRouter();
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
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans text-zinc-900 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md space-y-12 text-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-zinc-950 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-2xl shadow-violet-500/20">
                        L
                    </div>
                </div>

                <div className="space-y-8">
                    {status === 'loading' && (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <div className="w-20 h-20 bg-zinc-50 rounded-3xl flex items-center justify-center animate-pulse">
                                    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-3xl font-black tracking-tight">Verificando...</h1>
                                <p className="text-zinc-500 font-medium">Validando suas credenciais Locatus.</p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center shadow-xl shadow-green-100/50">
                                        <ShieldCheck className="w-10 h-10 text-green-500" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 italic">
                                        <Sparkles className="w-3 h-3" /> Sucesso
                                    </div>
                                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-tight">
                                        Identidade <br />
                                        <span className="text-violet-600">Confirmada.</span>
                                    </h1>
                                    <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <NextLink
                                href="/login"
                                className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 flex items-center justify-center gap-2 group text-sm uppercase tracking-widest"
                            >
                                Acessar Plataforma <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </NextLink>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center shadow-xl shadow-red-100/50">
                                        <XCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-tight">
                                        Oops! Algo deu <br />
                                        <span className="text-red-600">errado.</span>
                                    </h1>
                                    <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                                        {message}
                                    </p>
                                </div>
                            </div>

                            <NextLink
                                href="/register"
                                className="w-full py-5 bg-zinc-950 hover:bg-zinc-800 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group text-sm uppercase tracking-widest"
                            >
                                Tentar novamente <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </NextLink>
                        </div>
                    )}
                </div>
            </div>

            {/* Micro branding */}
            <div className="absolute bottom-10 text-center w-full">
                <p className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">
                    Locatus Security Protocols © 2026
                </p>
            </div>
        </div>
    );
}
