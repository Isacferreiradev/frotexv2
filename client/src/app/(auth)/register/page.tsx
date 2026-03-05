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
    TrendingUp
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
        <div className="min-h-screen bg-white flex flex-col md:flex-row font-sans text-zinc-900 overflow-hidden">

            {/* ─── PAINEL ESQUERDO: Hero (Startup Americana) ─── */}
            <div className="hidden lg:flex lg:w-[42%] relative bg-zinc-950 p-16 flex-col justify-between overflow-hidden border-r border-white/10">
                {/* Background Blobs (Premium Gradientes) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-indigo-600/15 rounded-full blur-[100px]" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="relative z-10 space-y-24">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-violet-600 font-black text-lg shadow-2xl shadow-violet-500/20 group-hover:scale-105 transition-transform duration-300">L</div>
                        <span className="font-black text-2xl tracking-tighter text-white">Locatus</span>
                    </Link>

                    {/* Value Propositions */}
                    <div className="space-y-12">
                        <div className="space-y-6">
                            <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
                                Transforme sua <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-400 to-violet-300">
                                    locação em ativo.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-lg font-medium leading-relaxed max-w-md">
                                A infraestrutura definitiva para locadoras que buscam escala, controle absoluto e rentabilidade máxima.
                            </p>
                        </div>

                        <div className="space-y-5">
                            {[
                                { icon: Zap, title: 'Ativação em Minutos', desc: 'Interface intuitiva projetada para velocidade.' },
                                { icon: Shield, title: 'Segurança Enterprise', desc: 'Seus dados protegidos por criptografia de ponta.' },
                                { icon: TrendingUp, title: 'ROI Inteligente', desc: 'Dashboard de rentabilidade em tempo real.' }
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

                {/* Social Proof / Footer */}
                <div className="relative z-10">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md space-y-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i * 123}`} alt="avatar" />
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-zinc-950 bg-violet-600 flex items-center justify-center text-[10px] font-bold text-white">
                                +500
                            </div>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                            Junte-se a <span className="text-white font-bold">500+ locadoras</span> que profissionalizaram sua operação com o Locatus.
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── PAINEL DIREITO: Formulário ─── */}
            <div className="flex-1 flex flex-col bg-white overflow-y-auto">

                {/* Mobile/Tablet Header */}
                <div className="lg:hidden p-6 flex items-center justify-between border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-white font-black text-xs">L</div>
                        <span className="font-black text-xl tracking-tight">Locatus</span>
                    </div>
                    <Link href="/login" className="text-xs font-black text-violet-600 uppercase tracking-widest">Login</Link>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16 max-w-2xl mx-auto w-full">

                    {/* Breadcrumbs / Progress */}
                    <div className="w-full mb-12 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
                        {STEPS.map((s, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className={cn(
                                    "transition-colors duration-300",
                                    step === s.id ? "text-violet-600" : (step > s.id ? "text-zinc-500" : "text-zinc-300")
                                )}>
                                    {s.title}
                                </span>
                                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-200" />}
                            </div>
                        ))}
                    </div>

                    <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                        {serverError && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-in shake duration-500">
                                <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                            </div>
                        )}

                        {/* ─── ETAPA 1: Segurança ─── */}
                        {step === 1 && (
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900">Comece seu legado.</h2>
                                    <p className="text-zinc-500 text-lg font-medium">Crie sua conta administrativa mestra.</p>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Users className="w-3 h-3" /> Seu Nome Completo
                                        </label>
                                        <input {...register('fullName')} placeholder="João da Silva" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all" />
                                        {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Lock className="w-3 h-3" /> E-mail Profissional
                                        </label>
                                        <input type="email" {...register('email')} placeholder="exemplo@empresa.com" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all" />
                                        {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Shield className="w-3 h-3" /> Senha de Acesso
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    {...register('password')}
                                                    placeholder="Mínimo 8 caracteres"
                                                    className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all pr-14"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-violet-600 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.password.message}</p>}
                                        </div>

                                        <div className="flex gap-1.5 px-1">
                                            {[1, 2, 3].map((s) => (
                                                <div key={s} className={cn(
                                                    "h-1.5 flex-1 rounded-full transition-all duration-500",
                                                    passwordStrength >= s ? "bg-violet-600" : "bg-zinc-100"
                                                )} />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button onClick={nextStep} className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest flex items-center justify-center gap-2 group">
                                        Continuar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <p className="text-center mt-6 text-sm text-zinc-500 font-medium">
                                        Já tem uma conta? <Link href="/login" className="text-violet-600 font-black hover:underline">Log-in</Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ─── ETAPA 2: Empresa ─── */}
                        {step === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900">Dados da Empresa.</h2>
                                    <p className="text-zinc-500 text-lg font-medium">Identidade jurídica da sua locadora.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                            <Building2 className="w-3 h-3" /> Nome da Locadora / Fantasia
                                        </label>
                                        <input {...register('tenantName')} placeholder="Ex: Master Locações" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm placeholder:text-zinc-400 focus:ring-4 focus:ring-violet-50 transition-all" />
                                        {errors.tenantName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.tenantName.message}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">CPF ou CNPJ</label>
                                            <input {...register('documentNumber')} placeholder="000.000.000-00" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                            {errors.documentNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.documentNumber.message}</p>}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">WhatsApp</label>
                                            <input {...register('phoneNumber')} placeholder="(11) 99999-9999" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                            {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phoneNumber.message}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="col-span-3 space-y-1.5">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Cidade</label>
                                            <input {...register('city')} placeholder="Ex: São Paulo" className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                        </div>
                                        <div className="col-span-1 space-y-1.5">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 text-center">UF</label>
                                            <input {...register('state')} maxLength={2} placeholder="SP" className="w-full px-4 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-center text-sm focus:ring-4 focus:ring-violet-50 transition-all uppercase" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 space-y-4">
                                    <button onClick={nextStep} className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest flex items-center justify-center gap-2 group">
                                        Próximo Passo <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <button onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-bold text-sm transition-colors text-center block">
                                        Voltar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─── ETAPA 3: Perfil Operacional ─── */}
                        {step === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black tracking-tight text-zinc-900">Sua Operação.</h2>
                                    <p className="text-zinc-500 text-lg font-medium">Ajude-nos a preparar seu painel Locatus.</p>
                                </div>

                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Frota Estimada (Ativos)</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['0-50', '51-200', '200+'].map((range) => (
                                                    <label key={range} className="cursor-pointer">
                                                        <input type="radio" {...register('toolCountRange')} value={range} className="sr-only peer" />
                                                        <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl peer-checked:border-violet-600 peer-checked:bg-violet-50 peer-checked:text-violet-600 transition-all text-center text-sm font-bold text-zinc-500">
                                                            {range}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <BarChart3 className="w-3 h-3" /> Como controla hoje?
                                            </label>
                                            <select {...register('currentControlMethod')} className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all appearance-none cursor-pointer">
                                                <option value="none">Ainda não controle</option>
                                                <option value="paper">Papel / Caderneta</option>
                                                <option value="spreadsheet">Planilhas Excel/Sheets</option>
                                                <option value="other_system">Outro Sistema</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest ml-1">Recorrência Mensal</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['0-10', '11-40', '40+'].map((range) => (
                                                    <label key={range} className="cursor-pointer">
                                                        <input type="radio" {...register('activeRentalsRange')} value={range} className="sr-only peer" />
                                                        <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl peer-checked:border-violet-600 peer-checked:bg-violet-50 peer-checked:text-violet-600 transition-all text-center text-sm font-bold text-zinc-500">
                                                            {range}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 space-y-4">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full py-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest flex items-center justify-center gap-2 group"
                                        >
                                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ativar minha Locadora <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" /></>}
                                        </button>
                                        <button type="button" onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-bold text-sm transition-colors text-center block">
                                            Voltar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Footer Policy */}
                    <div className="mt-auto pt-16 text-center">
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest leading-relaxed">
                            Ao continuar, você concorda com nossos <br />
                            <span className="text-violet-600 cursor-pointer hover:underline">Termos de Serviço</span> e <span className="text-violet-600 cursor-pointer hover:underline">Privacidade</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
