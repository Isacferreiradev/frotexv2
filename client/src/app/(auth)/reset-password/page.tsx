'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Eye,
    EyeOff,
    Loader2,
    ChevronRight,
    ShieldCheck,
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
            await api.post('/auth/reset-password', { token, password: data.password });
            setIsSuccess(true);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao redefinir senha. O link pode ter expirado.');
        }
    };

    if (!token && !isSuccess) {
        return (
            <div className="text-center space-y-5">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
                    <ShieldCheck className="w-8 h-8 text-red-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 font-heading">Link inválido</h2>
                    <p className="text-zinc-500 text-[15px] mt-1">Este link de recuperação é inválido ou já expirou.</p>
                </div>
                <Link href="/login" className="inline-flex items-center gap-1 text-violet-500 font-semibold hover:text-violet-600 transition-colors text-sm">
                    Voltar para o login <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center space-y-5">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto border border-violet-100">
                    <ShieldCheck className="w-8 h-8 text-violet-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 font-heading">Senha atualizada!</h2>
                    <p className="text-zinc-500 text-[15px] mt-1">Sua nova senha foi configurada com sucesso.</p>
                </div>
                <Link href="/login" className="btn-primary inline-flex w-auto px-8">
                    Entrar na conta <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {serverError && (
                <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                </div>
            )}

            <div>
                <label className="label">Nova senha</label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        {...register('password')}
                        placeholder="Mínimo 6 caracteres"
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

            <div>
                <label className="label">Confirmar nova senha</label>
                <input
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="Repita a nova senha"
                    className="input-field"
                />
                {errors.confirmPassword && <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword.message}</p>}
            </div>

            <div className="pt-1">
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                    {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>Redefinir senha <ChevronRight className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col selection:bg-violet-100 selection:text-violet-900">

            {/* Top Bar */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">L</div>
                    <span className="font-bold text-lg text-zinc-900 font-heading">Locattus</span>
                </Link>
            </header>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-zinc-900 font-heading tracking-tight">Redefinir senha</h1>
                        <p className="text-zinc-500 text-[15px] mt-1">Crie uma nova senha para sua conta.</p>
                    </div>

                    <Suspense fallback={
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        </div>
                    }>
                        <ResetPasswordForm />
                    </Suspense>

                    <p className="mt-8 text-center text-sm text-zinc-500">
                        Lembrou a senha?{' '}
                        <Link href="/login" className="text-violet-500 font-semibold hover:text-violet-600 transition-colors">
                            Entrar
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
