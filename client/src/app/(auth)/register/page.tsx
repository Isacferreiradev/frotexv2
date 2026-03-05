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
    ArrowLeft,
    Check,
    Shield,
    Building2,
    BarChart3,
    Sparkles,
    Lock,
    Users,
    ChevronRight,
    Zap,
    TrendingUp,
    MapPin,
    Smartphone,
    Mail
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
    state: z.string().length(2, 'UF obrigatória'),

    // Step 3: Profile
    toolCountRange: z.string().optional(),
    currentControlMethod: z.string().optional(),
    activeRentalsRange: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

const STEPS = [
    { id: 1, title: 'Segurança' },
    { id: 2, title: 'Empresa' },
    { id: 3, title: 'Operação' },
];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [serverError, setServerError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, trigger, watch, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange'
    });

    const nextStep = async () => {
        let fieldsToValidate: (keyof RegisterForm)[] = [];
        if (step === 1) fieldsToValidate = ['email', 'password', 'fullName'];
        if (step === 2) fieldsToValidate = ['tenantName', 'documentNumber', 'phoneNumber', 'city', 'state'];

        const isValid = await trigger(fieldsToValidate);
        if (isValid) setStep(s => s + 1);
    };

    const prevStep = () => setStep(s => s - 1);

    const onSubmit = async (data: RegisterForm) => {
        setServerError('');
        try {
            await api.post('/auth/register', data);
            router.push('/registration-success');
        } catch (err: any) {
            setServerError(err.response?.data?.message || 'Erro ao cadastrar');
        }
    };

    const passwordValue = watch('password') || '';
    const passwordStrength = passwordValue.length === 0 ? 0 :
        (passwordValue.length >= 8 ? 1 : 0) +
        (/[A-Z]/.test(passwordValue) ? 1 : 0) +
        (/[0-9]/.test(passwordValue) ? 1 : 0);

    return (
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-inter text-zinc-950 overflow-hidden selection:bg-violet-100 selection:text-violet-900">

            {/* ─── PAINEL ESQUERDO: Hero (Futuristic & Dynamic) ─── */}
            <div className="hidden lg:flex lg:w-[45%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden border-r border-white/5">
                {/* Advanced Mesh Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[100%] h-[100%] bg-violet-600/20 rounded-full blur-[160px] animate-pulse" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[80%] bg-indigo-600/10 rounded-full blur-[140px]" />
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-150 brightness-100 mix-blend-overlay" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/50 to-zinc-950" />
                </div>

                <div className="relative z-10 space-y-32">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-zinc-950 font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-all duration-500">L</div>
                        <span className="font-bold text-3xl tracking-tight text-white font-outfit">Locatus</span>
                    </Link>

                    {/* Value Propositions */}
                    <div className="space-y-16">
                        <div className="space-y-6">
                            <h1 className="text-6xl font-black text-white leading-[1.05] tracking-tight font-outfit">
                                Transforme sua <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-200 text-glow">
                                    locação em ativo.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-xl font-medium leading-relaxed max-w-sm">
                                A infraestrutura definitiva para locadoras que buscam escala e precisão absoluta.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8">
                            {[
                                { icon: Zap, title: 'Ativação Instantânea', desc: 'Interface intuitiva projetada para velocidade.' },
                                { icon: Shield, title: 'Segurança Enterprise', desc: 'Dados protegidos com padrões bancários.' },
                                { icon: TrendingUp, title: 'Algoritmos de ROI', desc: 'Dashboard de rentabilidade em tempo real.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6 items-start group">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 transition-all duration-500 shrink-0">
                                        <item.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <h3 className="text-white font-bold text-base tracking-tight font-outfit">{item.title}</h3>
                                        <p className="text-zinc-500 text-sm leading-relaxed font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status / Footer */}
                <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                        </div>
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] font-outfit">
                            System Live — Onboarding Mode
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Onboarding (Glass & Flow) ─── */}
            <div className="flex-1 flex flex-col bg-white relative overflow-y-auto mesh-gradient">

                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-24 max-w-3xl mx-auto w-full relative z-10">

                    {/* Floating Progress Bar (Breadcrumbs Evolution) */}
                    <div className="w-full mb-16 flex items-center justify-between px-2">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center flex-1 group">
                                <div className="flex flex-col gap-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-500 border",
                                            step === s.id ? "bg-zinc-950 text-white border-zinc-950 shadow-xl" : (step > s.id ? "bg-violet-600 text-white border-violet-600" : "bg-zinc-50 text-zinc-300 border-zinc-100")
                                        )}>
                                            {step > s.id ? <Check className="w-3.5 h-3.5" /> : `0${s.id}`}
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 font-outfit",
                                            step === s.id ? "text-zinc-950" : (step > s.id ? "text-violet-600" : "text-zinc-300")
                                        )}>
                                            {s.title}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "h-1.5 w-full rounded-full transition-all duration-1000",
                                        step > s.id ? "bg-violet-600" : (step === s.id ? "bg-zinc-950" : "bg-zinc-100")
                                    )} />
                                </div>
                                {i < STEPS.length - 1 && <div className="w-8" />}
                            </div>
                        ))}
                    </div>

                    {/* Surgical Glass Form Container */}
                    <div className="w-full glass-surgical p-10 md:p-14 rounded-[3rem] border border-zinc-200/50 space-y-12 animate-in slide-in-from-bottom-8 duration-1000">
                        {serverError && (
                            <div className="p-5 bg-red-50/50 border border-red-100 rounded-2xl animate-in shake duration-500 text-center">
                                <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{serverError}</p>
                            </div>
                        )}

                        {/* ─── ETAPA 1: Segurança ─── */}
                        {step === 1 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-black tracking-tight text-zinc-950 font-outfit leading-none">Identidade.</h2>
                                    <p className="text-zinc-500 text-lg font-medium tracking-tight">Crie sua conta mestra de administração.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within:text-violet-600 transition-colors">
                                            <Users className="w-3.5 h-3.5" /> Nome do Administrador
                                        </label>
                                        <input {...register('fullName')} placeholder="Ex: Rodrigo Freitas" className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium" />
                                        {errors.fullName && <p className="text-[10px] text-red-500 font-black ml-1 uppercase">{errors.fullName.message}</p>}
                                    </div>

                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within:text-violet-600 transition-colors">
                                            <Mail className="w-3.5 h-3.5" /> E-mail Profissional
                                        </label>
                                        <input type="email" {...register('email')} placeholder="rodrigo@suaempresa.com" className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium" />
                                        {errors.email && <p className="text-[10px] text-red-500 font-black ml-1 uppercase">{errors.email.message}</p>}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within:text-violet-600 transition-colors">
                                                <Lock className="w-3.5 h-3.5" /> Chave de Segurança
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    {...register('password')}
                                                    placeholder="Mínimo 8 caracteres"
                                                    className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium pr-16"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 px-1">
                                            {[1, 2, 3].map((s) => (
                                                <div key={s} className={cn(
                                                    "h-1.5 flex-1 rounded-full transition-all duration-700 shadow-sm",
                                                    passwordStrength >= s ? "bg-violet-600 shadow-violet-200/50" : "bg-zinc-100"
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8">
                                    <button onClick={nextStep} className="w-full py-6 bg-zinc-950 hover:bg-zinc-900 text-white font-black rounded-2xl transition-all shadow-2xl hover:-translate-y-1 active:scale-[0.98] text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 group">
                                        Iniciar Protocolo <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <p className="text-center mt-10 text-sm text-zinc-500 font-medium">
                                        Já possui acesso? <Link href="/login" className="text-violet-600 font-black hover:text-violet-700 uppercase text-[11px] tracking-widest">Protocolo de Login</Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ─── ETAPA 2: Empresa ─── */}
                        {step === 2 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-black tracking-tight text-zinc-950 font-outfit leading-none">Infraestrutura.</h2>
                                    <p className="text-zinc-500 text-lg font-medium tracking-tight">Defina os parâmetros jurídicos de sua operação.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="group space-y-2">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-focus-within:text-violet-600 transition-colors">
                                            <Building2 className="w-3.5 h-3.5" /> Nome da Locadora (Razão/Fantasia)
                                        </label>
                                        <input {...register('tenantName')} placeholder="Ex: AlugaFácil Infra" className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base placeholder:text-zinc-400 focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <Smartphone className="w-3.5 h-3.5" /> WhatsApp Business
                                            </label>
                                            <input {...register('phoneNumber')} placeholder="(11) 99999-9999" className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all" />
                                        </div>
                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <Shield className="w-3.5 h-3.5" /> CPF ou CNPJ
                                            </label>
                                            <input {...register('documentNumber')} placeholder="00.000.000/0000-00" className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-6">
                                        <div className="col-span-3 group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5" /> Cidade Sede
                                            </label>
                                            <input {...register('city')} placeholder="Ex: São Paulo" className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all" />
                                        </div>
                                        <div className="col-span-1 group space-y-2 text-center">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">UF</label>
                                            <input {...register('state')} maxLength={2} placeholder="SP" className="w-full py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base text-center focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all uppercase" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 space-y-4">
                                    <button onClick={nextStep} className="w-full py-6 bg-zinc-950 hover:bg-zinc-900 text-white font-black rounded-2xl transition-all shadow-2xl hover:-translate-y-1 active:scale-[0.98] text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3">
                                        Verificar Parâmetros <ArrowRight className="w-5 h-5" />
                                    </button>
                                    <button onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                        <ArrowLeft className="w-3 h-3" /> Revisar Identidade
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── ETAPA 3: Perfil Operacional ─── */}
                        {step === 3 && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                                <div className="space-y-4">
                                    <h2 className="text-5xl font-black tracking-tight text-zinc-950 font-outfit leading-none">Operação.</h2>
                                    <p className="text-zinc-500 text-lg font-medium tracking-tight">Sintonize sua interface com seu volume de frotas.</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Frota Ativa Estimada (Unidades)</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['0-100', '101-500', '500+'].map((range) => (
                                                    <label key={range} className="cursor-pointer group">
                                                        <input type="radio" {...register('toolCountRange')} value={range} className="sr-only peer" />
                                                        <div className="p-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-violet-200 transition-all text-center text-sm font-black font-outfit">
                                                            {range}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="group space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                                <BarChart3 className="w-3.5 h-3.5" /> Metodologia Atual de Controle
                                            </label>
                                            <select {...register('currentControlMethod')} className="w-full px-7 py-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl text-base appearance-none cursor-pointer focus:bg-white focus:ring-4 focus:ring-violet-500/5 focus:border-violet-500 transition-all font-medium">
                                                <option value="none">Nenhuma (Início de Operação)</option>
                                                <option value="paper">Protocolos Manuais / Papel</option>
                                                <option value="spreadsheet">Clusters em Planilhas</option>
                                                <option value="other_system">Software Legado / Outros</option>
                                            </select>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Volume de Recorrência Mensal</label>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['Small', 'Scale', 'High'].map((range) => (
                                                    <label key={range} className="cursor-pointer group">
                                                        <input type="radio" {...register('activeRentalsRange')} value={range} className="sr-only peer" />
                                                        <div className="p-5 bg-zinc-50/50 border border-zinc-200 rounded-2xl peer-checked:border-violet-600 peer-checked:bg-violet-600 peer-checked:text-white peer-checked:shadow-xl peer-checked:shadow-violet-200 transition-all text-center text-sm font-black font-outfit uppercase tracking-tighter">
                                                            {range}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 space-y-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-6 bg-zinc-950 hover:bg-zinc-900 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-2xl hover:-translate-y-1 active:scale-[0.98] text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-3 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {isSubmitting ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                <>Implantar Sistema <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" /></>
                                            )}
                                        </button>
                                        <button type="button" onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-black text-[10px] uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                                            <ArrowLeft className="w-3 h-3" /> Revisar Infraestrutura
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Minimalist Policy Action */}
                    <div className="mt-20 text-center w-full max-w-md">
                        <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.5em] leading-loose">
                            Ao prosseguir você autentica nossos <span className="text-violet-600">Termos de Protocolo</span> <br /> e <span className="text-violet-600">Diretrizes de Identidade v2.0</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
