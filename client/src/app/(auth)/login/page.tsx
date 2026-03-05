'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Eye,
    EyeOff,
    Loader2,
    ArrowRight,
    Lock,
    Mail,
    Sparkles,
    Shield,
    Zap,
    TrendingUp
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ForgotPasswordModal } from '@/components/shared/ForgotPasswordModal';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((s) => s.setAuth);
    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError('');
        try {
            const res = await api.post('/auth/login', data);
            const { accessToken, refreshToken, user } = res.data.data;
            setAuth(user, accessToken, refreshToken);
            router.push('/dashboard');
        } catch (err: any) {
            if (err.response?.status === 403) {
                router.push('/registration-success');
                return;
            }
            setServerError(err.response?.data?.message || 'Credenciais inválidas');
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-inter text-zinc-950 overflow-hidden selection:bg-violet-100 selection:text-violet-900">

            {/* ─── PAINEL ESQUERDO: Hero (Futuristic & Dynamic) ─── */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden border-r border-white/5">
                {/* Advanced Mesh Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-violet-600/20 rounded-full blur-[160px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[140px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
                </div>

                <div className="relative z-10 space-y-32">
                    {/* Logo: Ultra-Minimalist Glow */}
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-950 font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.15)] group-hover:scale-105 group-hover:shadow-[0_0_60px_rgba(255,255,255,0.25)] transition-all duration-500">
                            L
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-white font-outfit">Locatus</span>
                    </Link>

                    {/* Value Propositions: Surgical Precision */}
                    <div className="space-y-16">
                        <div className="space-y-6">
                            <h1 className="text-6xl font-black text-white leading-[1.05] tracking-tight font-outfit">
                                A Próxima Era <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-200 text-glow">
                                    da Gestão.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-sm">
                                Infraestrutura inteligente para escalar sua locadora com precisão cirúrgica.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {[
                                { icon: Zap, title: 'Ativação Instantânea', desc: 'Integre sua operação em milissegundos.' },
                                { icon: Shield, title: 'Protocolo de Segurança', desc: 'Arquitetura bancária para dados sensíveis.' },
                                { icon: TrendingUp, title: 'Predição por IA', desc: 'Insights futuristas sobre seu faturamento.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 items-start group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white group-hover:border-violet-400 transition-all duration-500 shrink-0">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-white font-bold text-base tracking-tight font-outfit">{item.title}</h3>
                                        <p className="text-zinc-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Status Label */}
                <div className="relative z-10 flex items-center gap-4">
                    <div className="flex gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/20" />
                    </div>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] font-outfit">
                        Locatus OS — Core v4.2.0 Active
                    </p>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Login (Glass & Precision) ─── */}
            <div className="flex-1 flex flex-col bg-white relative overflow-y-auto mesh-gradient">

                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 max-w-2xl mx-auto w-full relative z-10">

                    {/* Floating Form Container: Surgical Glass */}
                    <div className="w-full glass-surgical p-10 md:p-14 rounded-[2.5rem] border border-zinc-200/50 space-y-12 animate-in slide-in-from-bottom-8 duration-1000">

                        {/* Header */}
                        <div className="w-full space-y-4">
                            <h2 className="text-5xl font-black tracking-tight text-zinc-950 font-outfit leading-none">Acesso.</h2>
                            <p className="text-zinc-500 text-lg font-medium tracking-tight">Insira suas credenciais para gerenciar a operação.</p>
                        </div>

                        <div className="w-full space-y-10">
                            {serverError && (
                                <div className="p-5 bg-red-50/50 border border-red-100 rounded-2xl animate-in shake duration-500">
                                    <p className="text-red-600 text-xs font-bold text-center uppercase tracking-widest">{serverError}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                <div className="space-y-6">
                                    {/* Email Field */}
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within:text-violet-600 transition-colors">
                                            <Mail className="w-3.5 h-3.5" /> Identificador Profissional
                                        </label>
                                        <input
                                            type="email"
                                            {...register('email')}
                                            placeholder="nome@corporativo.com"
                                            className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all duration-300 font-medium"
                                        />
                                        {errors.email && <p className="text-[10px] text-red-500 font-black ml-1 uppercase tracking-widest">{errors.email.message}</p>}
                                    </div>

                                    {/* Password Field */}
                                    <div className="group space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2 group-focus-within:text-violet-600 transition-colors">
                                                <Lock className="w-3.5 h-3.5" /> Chave de Acesso
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotModalOpen(true)}
                                                className="text-[10px] font-black text-zinc-400 uppercase tracking-widest hover:text-violet-600 transition-colors"
                                            >
                                                Esqueceu?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                {...register('password')}
                                                placeholder="••••••••••••"
                                                className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all duration-300 font-medium pr-16"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-[10px] text-red-500 font-black ml-1 uppercase tracking-widest">{errors.password.message}</p>}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-6 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-[0_20px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_25px_50px_rgba(0,0,0,0.15)] hover:-translate-y-1 active:scale-[0.98] text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {isSubmitting ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>Entrar no Ecossistema <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" /></>
                                    )}
                                </button>
                            </form>

                            <div className="pt-8 text-center border-t border-zinc-100">
                                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                    Nova operação? <br />
                                    <Link href="/register" className="text-violet-600 font-black hover:text-violet-700 inline-flex items-center gap-2 group mt-2 uppercase text-[11px] tracking-widest">
                                        Ativar Locadora <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Micro branding Action */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center w-full max-w-md">
                    <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.5em]">
                        Locatus Modular Infrastructure © 2026
                    </p>
                </div>
            </div>

            <ForgotPasswordModal
                open={isForgotModalOpen}
                onOpenChange={setIsForgotModalOpen}
            />
        </div>
    );
}
