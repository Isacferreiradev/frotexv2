'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Eye,
    EyeOff,
    Loader2,
    ArrowRight,
    ShieldCheck,
    KeyRound,
    Zap,
    Shield,
    TrendingUp,
    Sparkles,
    Lock,
    ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const schema = z.object({
    password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [showPassword, setShowPassword] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        if (!token) {
            setServerError('Token de recuperação não encontrado.');
            return;
        }

        setServerError('');
        try {
            await api.post('/auth/reset-password', {
                token,
                password: data.password
            });
            setIsSuccess(true);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
        }
    };

    if (!token && !isSuccess) {
        return (
            <div className="text-center space-y-8 animate-in fade-in duration-700">
                <div className="w-20 h-20 bg-red-50/50 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mx-auto border border-red-100/50 shadow-2xl shadow-red-500/10">
                    <Shield className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight font-heading">Link Inválido</h2>
                    <p className="text-zinc-500 font-medium leading-relaxed">Este link de recuperação é inválido ou já expirou.</p>
                </div>
                <NextLink
                    href="/login"
                    className="inline-flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-80 transition-opacity"
                >
                    Voltar para o Login <ArrowRight className="w-3 h-3" />
                </NextLink>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto border border-primary/10 shadow-2xl shadow-primary/20 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ShieldCheck className="w-12 h-12 text-primary relative z-10" />
                </div>
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/10 italic">
                        <Sparkles className="w-3 h-3" /> Protocolo Concluído
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 tracking-tight leading-tight font-heading">
                        Senha <br />
                        <span className="text-primary text-glow-sm">Atualizada.</span>
                    </h2>
                    <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">
                        Sua identidade foi revalidada. Acesse o sistema agora.
                    </p>
                </div>
                <NextLink
                    href="/login"
                    className="w-full flex items-center justify-center gap-3 py-5 bg-zinc-900 text-white rounded-2xl text-sm font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-zinc-950/20 hover:bg-black active:scale-[0.98] group"
                >
                    Entrar na Locadora <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </NextLink>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-4 font-sans">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-zinc-200">
                    <Lock className="w-3 h-3" /> Camada de Segurança
                </div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tight font-heading leading-tight">
                    Nova Senha.
                </h1>
                <p className="text-zinc-500 text-lg font-medium leading-tight">
                    Crie uma credencial forte para sua operação.
                </p>
            </div>

            {serverError && (
                <div className="p-4 bg-red-50/50 backdrop-blur-sm border border-red-100 rounded-2xl text-[11px] font-bold text-red-600 text-center animate-in shake duration-500">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <KeyRound className="w-3.5 h-3.5" /> Nova Senha
                        </label>
                        <div className="relative group">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder="Criptografia mínima 6 caracteres"
                                className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5" /> Confirmar Senha
                        </label>
                        <input
                            type="password"
                            {...register('confirmPassword')}
                            placeholder="Repita a nova senha"
                            className="w-full px-6 py-4 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all outline-none font-medium"
                        />
                        {errors.confirmPassword && (
                            <p className="text-[10px] text-red-500 font-bold ml-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-5 bg-primary text-white font-black rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-sm uppercase tracking-widest group relative overflow-hidden hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span className="relative z-10">Atualizar Credenciais</span>
                                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform relative z-10" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-zinc-900 overflow-hidden">

            {/* PAINEL ESQUERDO: Hero (Surgical Identity) */}
            <div className="hidden lg:flex lg:w-[45%] relative p-16 flex-col justify-between overflow-hidden border-r border-zinc-200">
                <div className="absolute inset-0 z-0 mesh-gradient opacity-40 animate-slow-spin-slow" />
                <div className="absolute inset-0 z-0 bg-white/40 backdrop-blur-[100px]" />
                <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-primary/20 to-transparent" />

                <div className="relative z-10 space-y-24">
                    <NextLink href="/" className="flex items-center gap-3 group">
                        <div className="w-12 h-12 bg-zinc-950 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl group-hover:scale-105 transition-transform duration-500">
                            L
                        </div>
                        <span className="font-black text-2xl tracking-tighter text-zinc-950 font-heading">Locatus</span>
                    </NextLink>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.25em] rounded-full border border-primary/10">
                                <Shield className="w-4 h-4" /> Identity Protocol
                            </div>
                            <h1 className="text-6xl font-black text-zinc-950 leading-[0.95] tracking-tight font-heading">
                                Proteção <br />
                                <span className="text-primary italic">Surgical.</span>
                            </h1>
                            <p className="text-zinc-500 text-xl font-medium leading-relaxed max-w-md">
                                Reestabeleça seu acesso à infraestrutura de gestão com segurança absoluta.
                            </p>
                        </div>

                        <div className="space-y-6 pt-8">
                            {[
                                { icon: Zap, title: 'Recuperação Veloz', desc: 'Processamento em milissegundos.' },
                                { icon: Shield, title: 'Criptografia Estrita', desc: 'Segurança de nível Enterprise.' },
                                { icon: TrendingUp, title: 'Continuidade de Dados', desc: 'Recupere sua operação sem perdas.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 items-start group">
                                    <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-400 group-hover:border-primary/30 group-hover:text-primary transition-all duration-500 shrink-0 shadow-sm">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-zinc-950 font-black text-[13px] uppercase tracking-wider font-heading">{item.title}</h3>
                                        <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="relative z-10">
                    <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.3em] leading-relaxed">
                        © 2026 Locatus Intelligence — Infraestrutura de Elite.
                    </p>
                </div>
            </div>

            {/* PAINEL DIREITO: Form */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto relative">
                {/* Decorative Elements */}
                <div className="absolute top-20 right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-20 left-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 relative z-10 w-full">
                    <div className="w-full max-w-sm glass-surgical p-10 rounded-[2.5rem] border-white/60 relative overflow-hidden backdrop-blur-2xl">
                        {/* Inner Glow */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                        <Suspense fallback={
                            <div className="flex flex-col items-center gap-6 py-20">
                                <div className="w-16 h-16 glass-surgical rounded-3xl flex items-center justify-center animate-pulse">
                                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                </div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Validando Protocolos...</p>
                            </div>
                        }>
                            <ResetPasswordForm />
                        </Suspense>
                    </div>

                    <div className="mt-12">
                        <NextLink
                            href="/login"
                            className="text-zinc-400 hover:text-zinc-950 text-[10px] font-black uppercase tracking-[0.2em] transition-colors"
                        >
                            Lembrou a senha? Voltar ao Login
                        </NextLink>
                    </div>
                </div>
            </div>
        </div>
    );
}
