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
    website: z.string().optional(), // Honeypot field
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
            router.push(`/registration-success?email=${encodeURIComponent(data.email)}`);
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
        <div className="h-screen bg-[#FDFDFD] flex flex-col lg:flex-row font-inter selection:bg-violet-100 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#7c3aed 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* ─── PAINEL ESQUERDO: Hero (Visible on Desktop) ─── */}
            <div className="hidden lg:flex lg:w-[40%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden shrink-0">
                <div className="absolute inset-0 z-0 opacity-40">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-violet-600/30 rounded-full blur-[120px]" />
                </div>

                <div className="relative z-10 space-y-32 flex-1 flex flex-col pt-12">
                    <Link href="/">
                        <div className="flex items-center gap-2 group cursor-pointer transition-transform active:scale-95">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-zinc-950 font-extrabold shadow-lg shadow-white/5 transition-colors">L</div>
                            <span className="text-2xl font-extrabold italic tracking-tight text-white font-outfit">Locattus<span className="text-violet-400 not-italic">.</span></span>
                        </div>
                    </Link>

                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-5xl font-extrabold text-white leading-[0.9] tracking-tight font-outfit">
                                A Revolução na <br />
                                <span className="text-violet-400 italic">Gestão de Frotas.</span>
                            </h1>
                            <p className="text-zinc-500 text-lg font-medium leading-relaxed max-w-sm">
                                Comece hoje sua jornada para a eficiência operacional absoluta.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Form ─── */}
            <div className="flex-1 flex flex-col p-4 sm:p-8 lg:p-12 relative z-10 overflow-hidden">
                {/* Mobile Top Bar */}
                <div className="flex items-center justify-between lg:hidden mb-6">
                    <Link href="/">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-zinc-950 rounded-lg flex items-center justify-center text-white font-extrabold shadow-lg">L</div>
                            <span className="text-xl font-extrabold italic tracking-tight text-zinc-950 font-outfit">Locattus<span className="text-violet-600 not-italic">.</span></span>
                        </div>
                    </Link>
                    <Link href="/login" className="text-[9px] font-extrabold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-full active:scale-95 transition-transform">
                        Login
                    </Link>
                </div>

                <div className="w-full max-w-lg mx-auto flex-1 flex flex-col justify-center">
                    {/* Step Indicators */}
                    <div className="flex items-center justify-between mb-8 sm:mb-10 relative px-4">
                        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-100 -translate-y-1/2 z-0" />
                        {STEPS.map((s) => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                                <div className={cn(
                                    "w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-extrabold transition-all duration-500 shadow-sm border",
                                    step > s.id ? "bg-violet-600 border-violet-600 text-white" :
                                        step === s.id ? "bg-white border-violet-600 text-violet-600 ring-4 ring-violet-50" :
                                            "bg-white border-slate-200 text-slate-300"
                                )}>
                                    {step > s.id ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3px]" /> : s.id}
                                </div>
                                <span className={cn(
                                    "text-[7px] sm:text-[9px] uppercase font-extrabold tracking-[0.2em] absolute -bottom-6 sm:-bottom-7 whitespace-nowrap",
                                    step >= s.id ? "text-slate-900" : "text-slate-300"
                                )}>{s.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white border border-slate-100 rounded-[2rem] p-5 sm:p-8 shadow-soft relative overflow-hidden min-h-[420px] flex flex-col">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 flex-1">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-outfit tracking-tight leading-none mb-2">Sua <span className="text-violet-600 italic">Conta.</span></h2>
                                        <p className="text-slate-500 font-medium text-xs sm:text-sm">Inicie configurando seus dados de acesso.</p>
                                    </div>
                                    <div className="hidden" aria-hidden="true"><input {...register('website')} tabIndex={-1} autoComplete="off" /></div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest ml-1">Nome completo</label>
                                            <input {...register('fullName')} placeholder="Ex: João da Silva" className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.fullName && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">{errors.fullName?.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest ml-1">Email profissional</label>
                                            <input type="email" {...register('email')} placeholder="seu@email.com" className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.email && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">{errors.email?.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest ml-1">Senha</label>
                                            <div className="relative">
                                                <input type={showPassword ? 'text' : 'password'} {...register('password')} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 px-1">
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">{errors.password?.message}</p>}
                                        </div>
                                    </div>
                                    <div className="pt-4">
                                        <button type="button" onClick={nextStep} className="w-full h-14 bg-slate-950 hover:bg-violet-700 text-white font-extrabold rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest group">
                                            Avançar <ChevronRight className="w-3 h-3 group-hover:translate-x-1" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 flex-1">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-outfit tracking-tight leading-none mb-2">Sua <span className="text-violet-600 italic">Empresa.</span></h2>
                                        <p className="text-slate-500 font-medium text-xs sm:text-sm">Dados da sua locadora.</p>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest ml-1">Nome Comercial</label>
                                            <input {...register('tenantName')} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            {errors.tenantName && <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest">{errors.tenantName?.message}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                                <label className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest ml-1">CPF ou CNPJ</label>
                                                <input {...register('documentNumber')} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            </div>
                                            <div className="space-y-1.5 col-span-2 sm:col-span-1">
                                                <label className="text-[9px] uppercase font-extrabold text-slate-400 tracking-widest ml-1">WhatsApp</label>
                                                <input {...register('phoneNumber')} className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-violet-500/5 focus:border-violet-600 transition-all" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setStep(1)} className="w-14 h-14 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100 hover:text-slate-900"><ArrowLeft className="w-5 h-5" /></button>
                                        <button type="button" onClick={nextStep} className="flex-1 h-14 bg-slate-950 hover:bg-violet-700 text-white font-extrabold rounded-xl text-[9px] uppercase tracking-widest">Avançar</button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 flex-1">
                                    <div>
                                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 font-outfit tracking-tight leading-none mb-2">Finalizar <span className="text-violet-600 italic">Operação.</span></h2>
                                        <p className="text-slate-500 font-medium text-xs sm:text-sm">Como você controla sua frota hoje?</p>
                                    </div>
                                    <div className="space-y-3">
                                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest ml-1">Método de Controle</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {METHODS.map(m => (
                                                <button
                                                    key={m}
                                                    type="button"
                                                    onClick={() => { setMethod(m); setValue('currentControlMethod', m); }}
                                                    className={cn("h-12 px-4 rounded-xl border text-[9px] font-bold uppercase transition-all", method === m ? "bg-violet-600 text-white border-violet-600" : "bg-slate-50 text-slate-500 border-slate-100")}
                                                >
                                                    {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={() => setStep(2)} className="w-14 h-14 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center border border-slate-100"><ArrowLeft className="w-5 h-5" /></button>
                                        <button
                                            onClick={handleSubmit(onSubmit)}
                                            disabled={isSubmitting}
                                            className="flex-1 h-14 bg-slate-950 hover:bg-violet-700 text-white font-extrabold rounded-xl text-[9px] uppercase tracking-widest flex items-center justify-center gap-3"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Concluir Cadastro"}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <p className="mt-8 text-center text-[10px] font-extrabold text-slate-300 uppercase tracking-[0.3em]">
                        Locattus Cloud Infrastructure © 2026
                    </p>
                </div>
            </div>
        </div>
    );
};
