'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';

export default function RegistrationSuccessPage() {
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

                {/* Content */}
                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 italic">
                            <Sparkles className="w-3 h-3" /> Conta Criada com Sucesso
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-zinc-900 leading-tight">
                            Verifique sua <br />
                            <span className="text-violet-600">Caixa de Entrada.</span>
                        </h1>
                        <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                            Um link de ativação foi enviado para o seu e-mail profissional.
                        </p>
                    </div>

                    <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] space-y-6 relative group overflow-hidden">
                        {/* Icon background */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-violet-100/50 rounded-full blur-2xl group-hover:bg-violet-200/50 transition-colors duration-500" />

                        <div className="relative z-10 flex justify-center">
                            <div className="w-20 h-20 bg-white shadow-xl shadow-zinc-200/50 rounded-3xl flex items-center justify-center">
                                <Mail className="w-10 h-10 text-violet-600" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 text-left p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-violet-50 flex items-center justify-center shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-violet-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest">Atenção</h4>
                                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                        Se não encontrar o e-mail, verifique a pasta de <b>Spam</b> ou <b>Promoções</b>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="space-y-6">
                    <p className="text-sm text-zinc-400 font-medium">
                        Algum problema? <span className="text-violet-600 font-black cursor-pointer hover:underline">Reenviar link</span>
                    </p>

                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para o Login
                    </Link>
                </div>
            </div>

            {/* Micro branding */}
            <div className="absolute bottom-10 text-center w-full">
                <p className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">
                    Locatus Intelligence © 2026
                </p>
            </div>
        </div>
    );
}
