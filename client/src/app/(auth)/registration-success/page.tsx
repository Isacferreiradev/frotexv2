'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, Wrench, CheckCircle2 } from 'lucide-react';

export default function RegistrationSuccessPage() {
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

                {/* Content */}
                <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-zinc-200 border border-zinc-100 space-y-6 relative overflow-hidden">
                    {/* Decorative blobs */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-violet-50 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-50" />

                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                <Mail className="w-8 h-8 text-green-500" />
                            </div>
                        </div>

                        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Verifique seu e-mail</h1>

                        <p className="text-zinc-500 leading-relaxed">
                            Quase lá! Enviamos um link de confirmação para o seu e-mail.
                            Por favor, clique no link para ativar sua conta.
                        </p>

                        <div className="pt-4 space-y-4">
                            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 flex items-start gap-3 text-left">
                                <CheckCircle2 className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-violet-700 font-medium">
                                    Não recebeu? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-zinc-500 hover:text-violet-600 transition-colors font-medium text-sm group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para o login
                </Link>
            </div>
        </div>
    );
}
