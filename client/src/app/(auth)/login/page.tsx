'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
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
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 font-sans text-zinc-900">
            {/* ─── Logo ─── */}
            <div className="mb-12 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl shadow-violet-200">
                    L
                </div>
                <span className="font-black text-2xl tracking-tighter">Locatus</span>
            </div>

            <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-700">
                {/* ─── Heading ─── */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">Bem-vindo de volta</h1>
                    <p className="text-zinc-500 font-medium">
                        Acesse sua locadora profissional.
                    </p>
                </div>

                {/* ─── Error ─── */}
                {serverError && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-500">
                        <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                    </div>
                )}

                {/* ─── Form ─── */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Mail className="w-3 h-3" /> E-mail
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="seu@email.com"
                                className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all"
                            />
                            {errors.email && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
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
                                    className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all pr-14"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 flex items-center justify-center gap-2 group text-sm uppercase tracking-widest"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>Entrar na Locadora <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" /></>
                        )}
                    </button>
                </form>

                <div className="pt-6 text-center">
                    <p className="text-sm text-zinc-500 font-medium">
                        Não tem conta?{' '}
                        <Link href="/register" className="text-violet-600 font-black hover:underline underline-offset-4">
                            Ative sua locadora agora
                        </Link>
                    </p>
                </div>
            </div>

            <p className="mt-20 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} Locatus Intelligence Platform.
            </p>

            <ForgotPasswordModal
                open={isForgotModalOpen}
                onOpenChange={setIsForgotModalOpen}
            />
        </div>
    );
}
