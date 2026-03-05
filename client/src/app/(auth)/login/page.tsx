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
    ChevronRight,
    Zap,
    Shield,
    TrendingUp,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ForgotPasswordModal } from '@/components/shared/ForgotPasswordModal';
import { motion } from 'framer-motion';

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
            setServerError(err.response?.data?.message || 'Email ou senha incorretos.');
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex overflow-hidden font-inter selection:bg-violet-100">

            {/* ─── PAINEL ESQUERDO: Hero ─── */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-violet-600/30 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/20 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 space-y-24">
                    {/* Logo */}
                    <Link href="/">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-950 font-black shadow-lg shadow-white/5 transition-colors">L</div>
                            <span className="text-2xl font-black italic tracking-tighter text-white font-outfit">Locatus<span className="text-violet-400 not-italic">.</span></span>
                        </div>
                    </Link>

                    {/* Headline */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter font-outfit">
                                Escalar é o seu <br />
                                <span className="text-violet-400 italic">Destino.</span>
                            </h1>
                            <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-sm">
                                O cockpit definitivo para locadoras que buscam alta performance e controle total.
                            </p>
                        </div>

                        <div className="space-y-8 pt-6 border-t border-white/5">
                            {[
                                { icon: Zap, title: 'Gestão Ágil', desc: 'Interface desenhada para velocidade operacional.' },
                                { icon: Shield, title: 'Segurança Elite', desc: 'Protocolos de criptografia de ponta a ponta.' },
                                { icon: TrendingUp, title: 'Foco em ROI', desc: 'Insights preditivos sobre o lucro da sua frota.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 shrink-0">
                                        <item.icon className="w-6 h-6 stroke-[1.5px]" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white font-bold text-sm tracking-tight">{item.title}</p>
                                        <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">LOCATUS SECURITY PROTOCOLS © 2026</p>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Form ─── */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative">
                {/* Background decoration in light mode */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#7c3aed 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />

                <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-16 lg:hidden">
                        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-black shadow-lg">L</div>
                        <span className="text-2xl font-black italic tracking-tighter text-zinc-950 font-outfit">Locatus<span className="text-violet-600 not-italic">.</span></span>
                    </div>

                    <div className="space-y-3 mb-12">
                        <h2 className="text-4xl font-black text-slate-950 tracking-tighter font-outfit leading-none">Bem-vindo <br /><span className="text-violet-600 italic">de volta.</span></h2>
                        <p className="text-slate-500 font-medium">Acesse seu cockpit administrativo.</p>
                    </div>

                    {serverError && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-600 text-xs font-bold uppercase tracking-widest">{serverError}</p>
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Email profissional</label>
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="seu@email.com"
                                className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all shadow-sm"
                            />
                            {errors.email && <p className="mt-2 text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between mb-1.5 px-1">
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em]">Senha</label>
                                <button
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(true)}
                                    className="text-[10px] text-violet-600 hover:text-violet-700 font-black uppercase tracking-widest transition-colors"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder="••••••••"
                                    className="w-full h-14 px-6 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-950 transition-colors px-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5 stroke-[1.5px]" /> : <Eye className="w-5 h-5 stroke-[1.5px]" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-2 text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.password.message}</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-16 bg-slate-950 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-2xl shadow-slate-200 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] active:scale-[0.98] disabled:opacity-50 group"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Acessar Painel <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-12 pt-8 border-t border-slate-50 text-center">
                        <p className="text-sm text-slate-400 font-medium">
                            Novo por aqui?{' '}
                            <Link href="/register" className="text-violet-600 font-black hover:text-violet-700 transition-colors uppercase text-xs tracking-widest ml-2">
                                Criar conta gratuita
                            </Link>
                        </p>
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
