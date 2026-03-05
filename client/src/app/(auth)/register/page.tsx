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
    ArrowLeft,
    ChevronRight,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const registerSchema = z.object({
    // Step 1: Account
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    fullName: z.string().min(2, 'Nome completo obrigatório'),

    // Step 2: Company
    tenantName: z.string().min(2, 'Nome da locadora obrigatório'),
    documentNumber: z.string().min(11, 'Documento inválido'),
    phoneNumber: z.string().min(10, 'Telefone inválido'),
    city: z.string().min(2, 'Cidade obrigatória'),
    state: z.string().length(2, 'UF inválida (ex: SP)'),

    // Step 3: Profile
    toolCountRange: z.string().optional(),
    currentControlMethod: z.string().optional(),
    activeRentalsRange: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

const STEPS = [
    { id: 1, label: 'Conta' },
    { id: 2, label: 'Empresa' },
    { id: 3, label: 'Operação' },
];

const TOOL_RANGES = ['1–10', '11–50', '51–200', '200+'];
const RENTAL_RANGES = ['1–5 por mês', '6–20 por mês', '21–50 por mês', '50+ por mês'];
const METHODS = ['Planilha Excel', 'Caderno/Papel', 'Outro sistema', 'Nenhum controle'];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, trigger, watch, setValue, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange'
    });

    const nextStep = async () => {
        const fieldsMap: Record<number, (keyof RegisterForm)[]> = {
            1: ['email', 'password', 'fullName'],
            2: ['tenantName', 'documentNumber', 'phoneNumber', 'city', 'state'],
        };
        const isValid = await trigger(fieldsMap[step]);
        if (isValid) setStep(s => s + 1);
    };

    const onSubmit = async (data: RegisterForm) => {
        setServerError('');
        try {
            await api.post('/auth/register', data);
            router.push('/registration-success');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
        }
    };

    const password = watch('password') || '';
    const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password)].filter(Boolean).length;
    const strengthLabels = ['', 'Fraca', 'Média', 'Forte'];
    const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-green-500'];

    const [toolRange, setToolRange] = useState('');
    const [method, setMethod] = useState('');
    const [rentalRange, setRentalRange] = useState('');

    return (
        <div className="min-h-screen bg-white flex flex-col selection:bg-violet-100 selection:text-violet-900">

            {/* Top Bar */}
            <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-100">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">L</div>
                    <span className="font-bold text-lg text-zinc-900 font-heading">Locatus</span>
                </Link>
                <span className="text-sm text-zinc-500">
                    Já tem conta?{' '}
                    <Link href="/login" className="text-violet-500 font-semibold hover:text-violet-600 transition-colors">Entrar</Link>
                </span>
            </header>

            {/* Progress Bar */}
            <div className="h-1 bg-zinc-100">
                <div
                    className="h-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${(step / 3) * 100}%` }}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">

                    {/* Step Indicators */}
                    <div className="flex items-center gap-3 mb-8">
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="flex items-center gap-3">
                                <div className={cn(
                                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                                    step > s.id ? "bg-violet-500 text-white" :
                                        step === s.id ? "bg-violet-500 text-white ring-4 ring-violet-100" :
                                            "bg-zinc-100 text-zinc-400"
                                )}>
                                    {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium",
                                    step >= s.id ? "text-zinc-900" : "text-zinc-400"
                                )}>{s.label}</span>
                                {i < STEPS.length - 1 && (
                                    <div className={cn(
                                        "flex-1 h-px w-8",
                                        step > s.id ? "bg-violet-300" : "bg-zinc-200"
                                    )} />
                                )}
                            </div>
                        ))}
                    </div>

                    {serverError && (
                        <div className="mb-6 p-3.5 bg-red-50 border border-red-100 rounded-xl">
                            <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                        </div>
                    )}

                    {/* ─── STEP 1: Conta ─── */}
                    {step === 1 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-7">
                                <h1 className="text-2xl font-bold text-zinc-900 font-heading tracking-tight">Crie sua conta</h1>
                                <p className="text-zinc-500 text-[15px] mt-1">Seus dados de acesso ao sistema.</p>
                            </div>

                            <div>
                                <label className="label">Nome completo</label>
                                <input {...register('fullName')} placeholder="João da Silva" className="input-field" />
                                {errors.fullName && <p className="mt-1.5 text-sm text-red-500">{errors.fullName.message}</p>}
                            </div>

                            <div>
                                <label className="label">Email</label>
                                <input type="email" {...register('email')} placeholder="seu@email.com" className="input-field" />
                                {errors.email && <p className="mt-1.5 text-sm text-red-500">{errors.email.message}</p>}
                            </div>

                            <div>
                                <label className="label">Senha</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        {...register('password')}
                                        placeholder="Mínimo 8 caracteres"
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
                                {password.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <div className="flex gap-1.5">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", strength >= i ? strengthColors[strength] : "bg-zinc-200")} />
                                            ))}
                                        </div>
                                        <p className="text-xs text-zinc-500">Força: <span className="font-semibold">{strengthLabels[strength]}</span></p>
                                    </div>
                                )}
                            </div>

                            <button type="button" onClick={nextStep} className="btn-primary mt-2">
                                Continuar <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* ─── STEP 2: Empresa ─── */}
                    {step === 2 && (
                        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-7">
                                <h1 className="text-2xl font-bold text-zinc-900 font-heading tracking-tight">Sua empresa</h1>
                                <p className="text-zinc-500 text-[15px] mt-1">Dados da sua locadora.</p>
                            </div>

                            <div>
                                <label className="label">Nome da locadora</label>
                                <input {...register('tenantName')} placeholder="Locadora Silva & Filhos" className="input-field" />
                                {errors.tenantName && <p className="mt-1.5 text-sm text-red-500">{errors.tenantName.message}</p>}
                            </div>

                            <div>
                                <label className="label">CPF ou CNPJ</label>
                                <input {...register('documentNumber')} placeholder="00.000.000/0001-00" className="input-field" />
                                {errors.documentNumber && <p className="mt-1.5 text-sm text-red-500">{errors.documentNumber.message}</p>}
                            </div>

                            <div>
                                <label className="label">WhatsApp / Telefone</label>
                                <input {...register('phoneNumber')} placeholder="(11) 99999-9999" className="input-field" />
                                {errors.phoneNumber && <p className="mt-1.5 text-sm text-red-500">{errors.phoneNumber.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Cidade</label>
                                    <input {...register('city')} placeholder="São Paulo" className="input-field" />
                                    {errors.city && <p className="mt-1.5 text-sm text-red-500">{errors.city.message}</p>}
                                </div>
                                <div>
                                    <label className="label">UF</label>
                                    <input {...register('state')} placeholder="SP" maxLength={2} className="input-field uppercase" />
                                    {errors.state && <p className="mt-1.5 text-sm text-red-500">{errors.state.message}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                                    <ArrowLeft className="w-4 h-4" /> Voltar
                                </button>
                                <button type="button" onClick={nextStep} className="btn-primary">
                                    Continuar <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── STEP 3: Perfil Operacional ─── */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="mb-7">
                                <h1 className="text-2xl font-bold text-zinc-900 font-heading tracking-tight">Seu perfil</h1>
                                <p className="text-zinc-500 text-[15px] mt-1">Nos conte sobre sua operação (opcional).</p>
                            </div>

                            <div>
                                <label className="label">Quantas ferramentas você tem?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {TOOL_RANGES.map(range => (
                                        <button
                                            key={range}
                                            type="button"
                                            onClick={() => { setToolRange(range); setValue('toolCountRange', range); }}
                                            className={cn(
                                                "py-2.5 px-4 rounded-xl border text-sm font-medium transition-all",
                                                toolRange === range
                                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                                    : "border-zinc-200 text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50"
                                            )}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">Como você controla hoje?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {METHODS.map(m => (
                                        <button
                                            key={m}
                                            type="button"
                                            onClick={() => { setMethod(m); setValue('currentControlMethod', m); }}
                                            className={cn(
                                                "py-2.5 px-4 rounded-xl border text-sm font-medium transition-all text-left",
                                                method === m
                                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                                    : "border-zinc-200 text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50"
                                            )}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="label">Volume de locações por mês?</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {RENTAL_RANGES.map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => { setRentalRange(r); setValue('activeRentalsRange', r); }}
                                            className={cn(
                                                "py-2.5 px-4 rounded-xl border text-sm font-medium transition-all",
                                                rentalRange === r
                                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                                    : "border-zinc-200 text-zinc-600 hover:border-violet-300 hover:bg-violet-50/50"
                                            )}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                                    <ArrowLeft className="w-4 h-4" /> Voltar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="btn-primary">
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>Criar conta <ChevronRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="mt-8 text-center text-xs text-zinc-400">
                        Ao criar sua conta, você concorda com os{' '}
                        <a href="#" className="underline hover:text-zinc-600 transition-colors">Termos de Uso</a>
                        {' '}e a{' '}
                        <a href="#" className="underline hover:text-zinc-600 transition-colors">Política de Privacidade</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
