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
    Sparkles,
    Shield,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

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
    const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-violet-500'];

    const [toolRange, setToolRange] = useState('');
    const [method, setMethod] = useState('');
    const [rentalRange, setRentalRange] = useState('');

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-inter selection:bg-violet-100 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#7c3aed 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Top Bar */}
            <header className="flex items-center justify-between px-10 py-6 border-b border-slate-50 relative z-10 bg-white/50 backdrop-blur-md">
                <Link href="/">
                    <div className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95">
                        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-black shadow-lg">L</div>
                        <span className="text-2xl font-black italic tracking-tighter text-zinc-950 font-outfit">Locatus<span className="text-violet-600 not-italic">.</span></span>
                    </div>
                </Link>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 font-medium hidden sm:inline">
                        Já possui acesso?
                    </span>
                    <Link href="/login" className="px-6 py-2.5 bg-violet-50 text-violet-600 font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-violet-100 transition-colors">
                        Fazer Login
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
                <div className="w-full max-w-lg">

                    {/* Step Indicators - Premium style */}
                    <div className="flex items-center justify-between mb-16 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 -translate-y-1/2 z-0" />
                        {STEPS.map((s, i) => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-500 shadow-sm border",
                                    step > s.id ? "bg-violet-600 border-violet-600 text-white" :
                                        step === s.id ? "bg-white border-violet-600 text-violet-600 ring-4 ring-violet-50" :
                                            "bg-white border-slate-200 text-slate-300"
                                )}>
                                    {step > s.id ? <Check className="w-5 h-5 stroke-[3px]" /> : s.id}
                                </div>
                                <span className={cn(
                                    "text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-8 whitespace-nowrap",
                                    step >= s.id ? "text-slate-900" : "text-slate-300"
                                )}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden min-h-[500px] flex flex-col">

                        {/* Status decoration */}
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Sparkles className="w-12 h-12 text-violet-600" />
                        </div>

                        {serverError && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-8 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <p className="text-red-600 text-xs font-bold uppercase tracking-widest leading-tight">{serverError}</p>
                            </motion.div>
                        )}

                        <AnimatePresence mode="wait">
                            {/* ─── STEP 1: Conta ─── */}
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 flex-1"
                                >
                                    <div className="mb-10">
                                        <h1 className="text-4xl font-black text-slate-950 font-outfit tracking-tighter leading-none mb-3">Bem-vindo à <br /><span className="text-violet-600 italic">Elite Logística.</span></h1>
                                        <p className="text-slate-500 font-medium">Inicie sua jornada configurando seu cockpit.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Nome completo</label>
                                            <input {...register('fullName')} placeholder="João da Silva" className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.fullName && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.fullName.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Email profissional</label>
                                            <input type="email" {...register('email')} placeholder="seu@email.com" className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.email && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.email.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Senha de acesso</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    {...register('password')}
                                                    placeholder="••••••••"
                                                    className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-950 transition-colors px-1"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5 stroke-[1.5px]" /> : <Eye className="w-5 h-5 stroke-[1.5px]" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.password.message}</p>}
                                            {password.length > 0 && (
                                                <div className="mt-4 px-1 space-y-2">
                                                    <div className="flex gap-1.5">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-all", strength >= i ? strengthColors[strength] : "bg-slate-100")} />
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Segurança: <span className={cn("font-black", strength === 3 ? "text-violet-600" : "text-slate-600")}>{strengthLabels[strength]}</span></p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <button type="button" onClick={nextStep} className="w-full h-16 bg-slate-950 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] group">
                                            Continuar Próxima Etapa <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── STEP 2: Empresa ─── */}
                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 flex-1"
                                >
                                    <div className="mb-10">
                                        <h1 className="text-4xl font-black text-slate-950 font-outfit tracking-tighter leading-none mb-3">Sua Locadora <br /><span className="text-violet-600 italic">em Detalhes.</span></h1>
                                        <p className="text-slate-500 font-medium">Configure as informações da sua frota.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Nome Comercial</label>
                                            <input {...register('tenantName')} placeholder="Elite Locações" className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.tenantName && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.tenantName.message}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">CPF ou CNPJ</label>
                                            <input {...register('documentNumber')} placeholder="00.000.000/0001-00" className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.documentNumber && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.documentNumber.message}</p>}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Cidade</label>
                                                <input {...register('city')} placeholder="São Paulo" className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                                {errors.city && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.city.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">UF</label>
                                                <input {...register('state')} placeholder="SP" maxLength={2} className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 uppercase focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                                {errors.state && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.state.message}</p>}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">WhatsApp / Telefone</label>
                                            <input {...register('phoneNumber')} placeholder="(11) 99999-9999" className="w-full h-14 px-6 bg-slate-50/50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-950 focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.phoneNumber && <p className="text-[10px] text-red-500 font-black uppercase tracking-widest ml-1">{errors.phoneNumber.message}</p>}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-6">
                                        <button type="button" onClick={() => setStep(1)} className="w-20 h-16 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-950 rounded-2xl transition-all border border-slate-100 flex items-center justify-center shrink-0 group">
                                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                        <button type="button" onClick={nextStep} className="flex-1 h-16 bg-slate-950 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] group">
                                            Avançar para Operação <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {/* ─── STEP 3: Perfil Operacional ─── */}
                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6 flex-1"
                                >
                                    <div className="mb-10">
                                        <h1 className="text-4xl font-black text-slate-950 font-outfit tracking-tighter leading-none mb-3">Última Etapa: <br /><span className="text-violet-600 italic">Operação.</span></h1>
                                        <p className="text-slate-500 font-medium">Personalizaremos sua interface com base nesses dados.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Volume de Equipamentos</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {TOOL_RANGES.map(range => (
                                                    <button
                                                        key={range}
                                                        type="button"
                                                        onClick={() => { setToolRange(range); setValue('toolCountRange', range); }}
                                                        className={cn(
                                                            "h-14 px-4 rounded-2xl border text-xs font-black transition-all uppercase tracking-widest",
                                                            toolRange === range
                                                                ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                                                                : "border-slate-100 bg-slate-50 text-slate-400 hover:border-violet-200"
                                                        )}
                                                    >
                                                        {range}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] ml-1">Método de Controle Atual</label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {METHODS.map(m => (
                                                    <button
                                                        key={m}
                                                        type="button"
                                                        onClick={() => { setMethod(m); setValue('currentControlMethod', m); }}
                                                        className={cn(
                                                            "h-14 px-4 rounded-2xl border text-[10px] font-black transition-all uppercase tracking-tight leading-none text-left",
                                                            method === m
                                                                ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                                                                : "border-slate-100 bg-slate-50 text-slate-400 hover:border-violet-200"
                                                        )}
                                                    >
                                                        {m}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-10">
                                        <button type="button" onClick={() => setStep(2)} className="w-20 h-16 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-950 rounded-2xl transition-all border border-slate-100 flex items-center justify-center shrink-0 group">
                                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                        <button
                                            onClick={handleSubmit(onSubmit)}
                                            disabled={isSubmitting}
                                            className="flex-1 h-16 bg-slate-950 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] group"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : (
                                                <>Finalizar Configuração <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <p className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
                        LOCATUS CLOUD PROTECTION INFRASTRUCTURE
                    </p>
                </div>
            </div>
        </div>
    );
}
