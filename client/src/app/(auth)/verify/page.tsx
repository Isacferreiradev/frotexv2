'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Wrench } from 'lucide-react';
import api from '@/lib/api';

export default function VerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando seu e-mail...');
    const verificationStarted = useRef(false);

    useEffect(() => {
        if (!token || verificationStarted.current) {
            return;
        }

        verificationStarted.current = true;

        const verify = async () => {
            try {
                const res = await api.get(`/auth/verify?token=${token}`);
                setStatus('success');
                setMessage(res.data.data.message || 'E-mail verificado com sucesso!');
            } catch (err: any) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'O link de verificação é inválido ou expirou.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Logo */}
                <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-violet-200">
                        L
                    </div>
                    <span className="font-black text-2xl tracking-tighter text-zinc-900">Locatus</span>
                </div>

                {/* Card */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200 border border-zinc-100 space-y-6 relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-50 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

                    <div className="relative z-10 space-y-6">
                        {status === 'loading' && (
                            <div className="space-y-4 py-8 flex flex-col items-center">
                                <Loader2 className="w-12 h-12 text-violet-600 animate-spin" />
                                <p className="text-zinc-500 font-medium">{message}</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center animate-bounce-slow">
                                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Tudo pronto!</h1>
                                <p className="text-zinc-500 leading-relaxed font-medium">
                                    {message}
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-2 w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-violet-200 hover:shadow-violet-300 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-sm"
                                    >
                                        Logar na Plataforma <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                                        <XCircle className="w-10 h-10 text-red-500" />
                                    </div>
                                </div>
                                <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Ops!</h1>
                                <p className="text-zinc-500 leading-relaxed font-medium">
                                    {message}
                                </p>
                                <div className="pt-4">
                                    <Link
                                        href="/register"
                                        className="inline-flex items-center justify-center gap-2 w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-zinc-200 hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-widest text-sm"
                                    >
                                        Tentar Cadastro Novamente
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Secondary action */}
                {status !== 'loading' && (
                    <Link
                        href="/login"
                        className="text-zinc-500 hover:text-violet-600 transition-colors font-medium text-sm"
                    >
                        Voltar para o login
                    </Link>
                )}
            </div>
        </div>
    );
}
