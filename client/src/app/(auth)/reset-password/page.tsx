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
    Sparkles
} from 'lucide-react';
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
                <div className="w-20 h-20 bg-red-50 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-red-100/50">
                    <ShieldCheck className="w-10 h-10 text-red-500" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Link Inválido</h2>
                    <p className="text-zinc-500 font-medium leading-relaxed">Este link de recuperação é inválido ou já expirou.</p>
                </div>
                <NextLink
                    href="/login"
                    className="inline-flex items-center gap-2 text-violet-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline"
                >
                    Voltar para o Login <ArrowRight className="w-3 h-3" />
                </NextLink>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-10 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-24 h-24 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl shadow-green-100/50">
                    <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-100 italic">
                        <Sparkles className="w-3 h-3" /> Sucesso
                    </div>
                    <h2 className="text-4xl font-black text-zinc-900 tracking-tight leading-tight">Senha <br /><span className="text-violet-600">Atualizada.</span></h2>
                    <p className="text-zinc-500 font-medium text-lg leading-relaxed max-w-xs mx-auto">Sua nova senha foi configurada. Acesse sua conta agora.</p>
                </div>
                <NextLink
                    href="/login"
                    className="w-full flex items-center justify-center gap-3 py-5 bg-violet-600 text-white rounded-2xl text-sm font-black uppercase tracking-[0.1em] transition-all shadow-xl shadow-violet-100 hover:bg-violet-700 active:scale-[0.98]"
                >
                    Entrar na Locadora <ArrowRight className="w-5 h-5" />
                </NextLink>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700">
            <div className="space-y-3 font-sans">
                <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Nova Senha.</h1>
                <p className="text-zinc-500 text-lg font-medium leading-tight">
                    Crie uma senha forte para proteger sua operação.
                </p>
            </div>

            {serverError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-xs font-bold text-red-600 text-center animate-in shake duration-500">
                    {serverError}
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <KeyRound className="w-3 h-3" /> Nova Senha
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                {...register('password')}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all"
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

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                            <ShieldCheck className="w-3 h-3" /> Confirmar Senha
                        </label>
                        <input
                            type="password"
                            {...register('confirmPassword')}
                            placeholder="Repita a nova senha"
                            className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all font-medium"
                        />
                        {errors.confirmPassword && (
                            <p className="text-[10px] text-red-500 font-bold ml-1">{errors.confirmPassword.message}</p>
                        )}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 flex items-center justify-center gap-3 text-sm uppercase tracking-widest group"
                >
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>Redefinir Senha <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" /></>
                    )}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-zinc-900 overflow-hidden">

            {/* PAINEL ESQUERDO: Hero */}
            <div className="hidden lg:flex lg:w-[42%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden border-r border-white/10">
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="relative z-10 space-y-24">
                    <NextLink href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-violet-600 font-black text-lg shadow-2xl shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">L</div>
                        <span className="font-black text-2xl tracking-tighter text-white">Locatus</span>
                    </NextLink>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                                Proteção <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300">
                                    da sua Identidade.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-md">
                                Reestabeleça seu acesso à infraestrutura de gestão mais avançada do mercado.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Zap, title: 'Recuperação Segura', desc: 'Processos criptografados de ponta a ponta.' },
                                { icon: Shield, title: 'Monitoramento de Acesso', desc: 'Auditamos cada alteração de senha.' },
                                { icon: TrendingUp, title: 'Operação Ininterrupta', desc: 'Sua locadora não pode parar.' }
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

                <div className="relative z-10">
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-relaxed">
                        © 2026 Locatus Intelligence Platform — Infraestrutura para o Mercado de Locação.
                    </p>
                </div>
            </div>

            {/* PAINEL DIREITO: Form */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">
                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 max-w-md mx-auto w-full">
                    <Suspense fallback={
                        <div className="flex flex-col items-center gap-6 py-20">
                            <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center animate-pulse">
                                <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                            </div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Carregando Protocolos...</p>
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
