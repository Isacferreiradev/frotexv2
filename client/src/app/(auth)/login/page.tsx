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
import { cn } from '@/lib/utils';

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
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-zinc-900 overflow-hidden">

            {/* ─── PAINEL ESQUERDO: Hero (Matching Register) ─── */}
            <div className="hidden lg:flex lg:w-[42%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden border-r border-white/10">
                {/* Background Blobs */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="relative z-10 space-y-24">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-violet-600 font-black text-lg shadow-2xl shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">L</div>
                        <span className="font-black text-2xl tracking-tighter text-white">Locatus</span>
                    </Link>

                    {/* Value Propositions */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                                Controle Total <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300">
                                    da sua Operação.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-md">
                                A plataforma que unifica ativos, faturamento e inteligência operacional em um único ecossistema.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Zap, title: 'Inscrição Rápida', desc: 'Sua locadora ativa em menos de 2 minutos.' },
                                { icon: Shield, title: 'Segurança Enterprise', desc: 'Dados protegidos com padrões bancários.' },
                                { icon: TrendingUp, title: 'IA Operacional', desc: 'Algoritmos que prevêem faturamento e ROI.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-600/20 group-hover:text-violet-300 transition-all duration-300 shrink-0">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-white font-bold text-sm tracking-tight">{item.title}</h3>
                                        <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer / Social Proof */}
                <div className="relative z-10">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
                        © 2026 Locatus Intelligence Platform — Infraestrutura para o Mercado de Locação.
                    </p>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Login ─── */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 max-w-md mx-auto w-full">

                    {/* Header */}
                    <div className="w-full space-y-3 mb-12">
                        <h2 className="text-4xl font-black tracking-tight text-zinc-900">Bem-vindo de volta.</h2>
                        <p className="text-zinc-500 text-lg font-medium tracking-tight">Acesse sua conta profissional para gerenciar sua locadora.</p>
                    </div>

                    <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                        {serverError && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-500">
                                <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> E-mail Profissional
                                    </label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        placeholder="exemplo@empresa.com"
                                        className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all"
                                    />
                                    {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> Senha
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setIsForgotModalOpen(true)}
                                            className="text-[10px] font-black text-violet-600 uppercase tracking-widest hover:text-violet-700 transition-colors"
                                        >
                                            Esqueceu?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            {...register('password')}
                                            placeholder="••••••••"
                                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all pr-14"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest flex items-center justify-center gap-2 group"
                            >
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Entrar na Locadora <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" /></>}
                            </button>
                        </form>

                        <div className="pt-6 text-center">
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                Ainda não tem acesso? <br />
                                <Link href="/register" className="text-violet-600 font-black hover:underline inline-flex items-center gap-1 group">
                                    Ative sua locadora agora <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ForgotPasswordModal
                open={isForgotModalOpen}
                onOpenChange={setIsForgotModalOpen}
            />
        </div>
    );
}
