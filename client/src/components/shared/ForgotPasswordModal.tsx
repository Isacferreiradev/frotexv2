'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const schema = z.object({
    email: z.string().email('E-mail inválido'),
});

type FormData = z.infer<typeof schema>;

interface ForgotPasswordModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ForgotPasswordModal({ open, onOpenChange }: ForgotPasswordModalProps) {
    const [isSuccess, setIsSuccess] = useState(false);
    const [serverError, setServerError] = useState('');

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setServerError('');
        try {
            await api.post('/auth/request-reset', data);
            setIsSuccess(true);
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao processar solicitação');
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        // Reset state after animation
        setTimeout(() => {
            setIsSuccess(false);
            setServerError('');
            reset();
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl">
                {!isSuccess ? (
                    <div className="flex flex-col">
                        <div className="bg-violet-600 p-6 sm:p-10 text-white relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-violet-400/20 rounded-full blur-xl" />

                            <div className="relative z-10 space-y-2">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30">
                                    <Mail className="w-6 h-6 text-white" />
                                </div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Recuperar Senha</DialogTitle>
                                <DialogDescription className="text-violet-100/80 font-medium text-sm">
                                    Digite seu e-mail abaixo e enviaremos as instruções.
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="p-6 sm:p-10 space-y-6 bg-white">
                            {serverError && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-[11px] font-bold text-red-600 uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                                    {serverError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-[0.2em] ml-1">
                                        Seu E-mail de Cadastro
                                    </label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        placeholder="exemplo@email.com"
                                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-violet-50 focus:border-violet-200 transition-all placeholder:text-zinc-300"
                                    />
                                    {errors.email && (
                                        <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-1">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full flex items-center justify-center gap-3 py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all shadow-lg shadow-violet-100 hover:shadow-violet-200 active:scale-[0.98]"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>Enviar Link <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">
                                Lembrou a senha?{' '}
                                <button
                                    onClick={handleClose}
                                    className="text-violet-600 hover:underline"
                                >
                                    Voltar para o Login
                                </button>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center space-y-8 bg-white flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center animate-in zoom-in-50 duration-500 shadow-inner">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">E-mail Enviado!</h3>
                            <p className="text-zinc-500 text-sm leading-relaxed max-w-[280px] mx-auto">
                                Se houver uma conta com este e-mail, você receberá um link de redefinição em alguns minutos.
                            </p>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full py-4 bg-zinc-900 hover:bg-black text-white rounded-2xl text-[10px] font-extrabold uppercase tracking-[0.2em] transition-all shadow-xl shadow-zinc-100 active:scale-[0.98]"
                        >
                            Entendi
                        </button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
