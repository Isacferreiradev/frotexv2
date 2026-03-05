'use client';

import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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

            <div className="w-full max-w-md space-y-10 text-center relative z-10">
                {/* Brand Logo - Matching Landing Page */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center mb-12"
                >
                    <Link href="/">
                        <div className="flex items-center gap-2 group cursor-pointer scale-110">
                            <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-black shadow-lg group-hover:bg-violet-600 transition-colors">L</div>
                            <span className="text-2xl font-black italic tracking-tighter font-outfit">Locatus<span className="text-violet-600 not-italic">.</span></span>
                        </div>
                    </Link>
                </motion.div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-violet-200">
                            QUASE LÁ
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-950 leading-[0.9] font-outfit">
                            Verifique sua <br />
                            <span className="text-violet-600 italic">Caixa de Entrada.</span>
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                            Um link de ativação segura foi enviado para o seu e-mail profissional.
                        </p>
                    </div>

                    <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] space-y-8 relative group overflow-hidden">
                        {/* Icon background decor */}
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-violet-50/50 rounded-full blur-3xl group-hover:bg-violet-100/50 transition-colors duration-700" />

                        <div className="relative z-10 flex justify-center">
                            <div className="w-24 h-24 bg-white shadow-2xl shadow-violet-100 rounded-[2.5rem] flex items-center justify-center border border-slate-50">
                                <Mail className="w-10 h-10 text-violet-600 stroke-[1.5px]" />
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-start gap-4 text-left p-5 bg-slate-50/50 border border-slate-100 rounded-[2rem]">
                                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 border border-slate-100">
                                    <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Dica Rápida</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Não esqueça de checar sua pasta de <b>Spam</b> caso o e-mail não apareça em instantes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Action */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-8"
                >
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-sm text-slate-400 font-medium">
                            Não recebeu o código?
                        </p>
                        <button className="text-violet-600 font-black text-xs uppercase tracking-widest hover:text-violet-700 transition-colors py-2 px-4 bg-violet-50 rounded-full">
                            Reenviar Link de Ativação
                        </button>
                    </div>

                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-950 transition-all font-bold text-[10px] uppercase tracking-[0.3em] group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Voltar para o Início
                    </Link>
                </motion.div>
            </div>

            {/* Micro branding */}
            <div className="absolute bottom-10 text-center w-full opacity-30">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
                    LOCATUS INTELLIGENCE — SECURITY LAYERS
                </p>
            </div>
        </div>
    );
}
