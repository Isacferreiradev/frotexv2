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
    Shield,
    Zap,
    TrendingUp,
    ChevronRight
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
            setServerError(err.response?.data?.message || 'Email ou senha incorretos.');
        }
    };

    return (
        <div className="min-h-screen bg-white flex overflow-hidden">

            {/* ─── PAINEL ESQUERDO: Hero ─── */}
            <div className="hidden lg:flex lg:w-[48%] relative bg-zinc-950 p-14 flex-col justify-between overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-violet-600/25 rounded-full blur-[120px]" />
                    <div className="absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[100px]" />
                </div>

                <div className="relative z-10 space-y-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-violet-600 font-bold text-lg shadow-lg group-hover:scale-105 transition-transform duration-300">
                            L
                        </div>
                        <span className="font-bold text-2xl text-white tracking-tight font-heading">Locatus</span>
                    </Link>

                    {/* Headline */}
                    <div className="space-y-10">
                        <div className="space-y-5">
                            <h1 className="text-5xl font-bold text-white leading-[1.1] tracking-tight font-heading">
                                Gestão completa <br />
                                <span className="text-violet-400">para sua locadora.</span>
                            </h1>
                            <p className="text-zinc-400 text-base leading-relaxed max-w-sm">
                                Controle de ferramentas, contratos, clientes e faturamento em um único sistema.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Zap, title: 'Rápido e eficiente', desc: 'Interface ágil para o dia a dia da operação.' },
                                { icon: Shield, title: 'Dados seguros', desc: 'Criptografia e backups automáticos.' },
                                { icon: TrendingUp, title: 'Relatórios inteligentes', desc: 'Insights sobre rentabilidade e inadimplência.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500/20 group-hover:text-violet-300 transition-all duration-300 shrink-0">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-sm">{item.title}</p>
                                        <p className="text-zinc-500 text-sm mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-zinc-600 text-xs">© 2026 Locatus — Todos os direitos reservados.</p>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Form ─── */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 bg-white">
                <div className="w-full max-w-sm">

                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-10 lg:hidden">
                        <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">L</div>
                        <span className="font-bold text-lg text-zinc-900 font-heading">Locatus</span>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h2 className="text-3xl font-bold text-zinc-900 tracking-tight font-heading">Entrar</h2>
                        <p className="text-zinc-500 text-[15px]">Acesse sua conta para continuar.</p>
                    </div>

                    {serverError && (
                        <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="seu@email.com"
                                className="input-field"
                            />
                            {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="label mb-0">Senha</label>
                                <button
                                    type="button"
                                    onClick={() => setIsForgotModalOpen(true)}
                                    className="text-sm text-violet-500 hover:text-violet-600 font-medium transition-colors"
                                >
                                    Esqueceu a senha?
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    {...register('password')}
                                    placeholder="Sua senha"
                                    className="input-field pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}
                        </div>

                        <div className="pt-1">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn-primary"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>Entrar <ChevronRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-[15px] text-zinc-500">
                        Não tem uma conta?{' '}
                        <Link href="/register" className="text-violet-500 font-semibold hover:text-violet-600 transition-colors">
                            Criar conta
                        </Link>
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
