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
    Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { FrotexLogo } from '@/components/shared/FrotexLogo';

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
    { id: 0, title: 'Início' },
    { id: 1, title: 'Segurança' },
    { id: 2, title: 'Empresa' },
    { id: 3, title: 'Operação' },
];

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
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
        <div className="min-h-screen bg-white flex flex-col font-sans text-zinc-900">
            {/* ─── Top Branding & Progress ─── */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center text-white font-black text-xs">L</div>
                    <span className="font-black text-xl tracking-tight">Locatus</span>
                </div>

                {step > 0 && (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 hidden md:flex">
                            {STEPS.map((s, i) => (
                                <div key={i} className="flex items-center">
                                    <div className={cn(
                                        "w-2 h-2 rounded-full transition-all duration-500",
                                        step >= s.id ? "bg-violet-600 w-6" : "bg-zinc-200"
                                    )} />
                                    {i < STEPS.length - 1 && <div className="w-4 h-[1px] bg-zinc-100" />}
                                </div>
                            ))}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            {STEPS[step].title}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
                {serverError && (
                    <div className="w-full max-w-md p-4 mb-8 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-300">
                        <p className="text-red-600 text-sm font-medium text-center">{serverError}</p>
                    </div>
                )}

                {/* ─── ETAPA 0: Introdução ─── */}
                {step === 0 && (
                    <div className="w-full text-center space-y-10 animate-in fade-in zoom-in-95 duration-500">
                        <div className="space-y-4">
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                                Organize sua <br className="hidden md:block" />
                                <span className="text-violet-600">locadora</span> em minutos.
                            </h1>
                            <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
                                Sistema profissional para controle de ferramentas, contratos e faturamento recorrente.
                            </p>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="px-10 py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-2xl shadow-violet-200 hover:-translate-y-1 active:scale-95 text-lg group"
                            >
                                Começar agora
                                <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <p className="text-sm text-zinc-400 font-medium">Sem cartão de crédito. Comece grátis.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10">
                            {[
                                { icon: Shield, title: 'Segurança Total', desc: 'Dados protegidos com criptografia bancária.' },
                                { icon: Building2, title: 'Gestão Profissional', desc: 'Controle de estoque e contratos automatizados.' },
                                { icon: BarChart3, title: 'IA Operacional', desc: 'Insights inteligentes sobre sua rentabilidade.' }
                            ].map((f, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 text-left space-y-3">
                                    <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center text-violet-600">
                                        <f.icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="font-bold text-lg">{f.title}</h3>
                                    <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── ETAPA 1: Segurança da Conta ─── */}
                {step === 1 && (
                    <div className="w-full max-w-lg space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Segurança da Conta</h2>
                            <p className="text-zinc-500">Configuração de acesso mestre do administrador.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Seu Nome Completo</label>
                                <input {...register('fullName')} placeholder="Ex: João da Silva" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                {errors.fullName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.fullName.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
                                <input type="email" {...register('email')} placeholder="exemplo@empresa.com" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            {...register('password')}
                                            placeholder="Mínimo 8 caracteres"
                                            className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all pr-14"
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

                                {/* Password Strength */}
                                <div className="flex gap-1 px-1">
                                    {[1, 2, 3].map((s) => (
                                        <div key={s} className={cn(
                                            "h-1 flex-1 rounded-full transition-all duration-500",
                                            passwordStrength >= s ? "bg-violet-600" : "bg-zinc-100"
                                        )} />
                                    ))}
                                </div>
                                <p className="text-[10px] text-zinc-400 font-medium px-1 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Seus dados são protegidos com criptografia.
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button onClick={nextStep} className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest">
                                Próximo passo
                            </button>
                            <button onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-bold text-sm transition-colors">
                                <ArrowLeft className="inline-block mr-2 w-4 h-4" /> Voltar
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── ETAPA 2: Informações da Locadora ─── */}
                {step === 2 && (
                    <div className="w-full max-w-lg space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Dados da Empresa</h2>
                            <p className="text-zinc-500">Identidade jurídica da sua locadora.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Nome da Locadora / Fantasia</label>
                                <input {...register('tenantName')} placeholder="Ex: Master Locações" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                {errors.tenantName && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.tenantName.message}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">CPF ou CNPJ</label>
                                    <input {...register('documentNumber')} placeholder="Apenas números" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                    {errors.documentNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.documentNumber.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp Comercial</label>
                                    <input {...register('phoneNumber')} placeholder="(11) 99999-9999" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                    {errors.phoneNumber && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.phoneNumber.message}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3 space-y-1.5">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Cidade</label>
                                    <input {...register('city')} placeholder="Ex: São Paulo" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all" />
                                    {errors.city && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.city.message}</p>}
                                </div>
                                <div className="col-span-1 space-y-1.5">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">UF</label>
                                    <input {...register('state')} maxLength={2} placeholder="SP" className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-center text-sm focus:ring-4 focus:ring-violet-50 transition-all uppercase" />
                                    {errors.state && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.state.message}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button onClick={nextStep} className="w-full py-5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest">
                                Próximo passo
                            </button>
                            <button onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-bold text-sm transition-colors">
                                <ArrowLeft className="inline-block mr-2 w-4 h-4" /> Voltar
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── ETAPA 3: Perfil Operacional ─── */}
                {step === 3 && (
                    <div className="w-full max-w-lg space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black tracking-tight">Sobre sua Operação</h2>
                            <p className="text-zinc-500">Ajude-nos a configurar as melhores ferramentas.</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Quantidade de Ferramentas / Ativos</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['0-50', '51-200', '200+'].map((range) => (
                                            <label key={range} className="cursor-pointer">
                                                <input type="radio" {...register('toolCountRange')} value={range} className="sr-only peer" />
                                                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl peer-checked:border-violet-600 peer-checked:bg-violet-50 transition-all text-center text-sm font-bold">
                                                    {range}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Como controla hoje?</label>
                                    <select {...register('currentControlMethod')} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:ring-4 focus:ring-violet-50 transition-all appearance-none">
                                        <option value="none">Ainda não controle</option>
                                        <option value="paper">Papel / Caderneta</option>
                                        <option value="spreadsheet">Planilhas Excel/Sheets</option>
                                        <option value="other_system">Outro Sistema</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Contratos Mensais Ativos</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['0-10', '11-40', '40+'].map((range) => (
                                            <label key={range} className="cursor-pointer">
                                                <input type="radio" {...register('activeRentalsRange')} value={range} className="sr-only peer" />
                                                <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl peer-checked:border-violet-600 peer-checked:bg-violet-50 transition-all text-center text-sm font-bold">
                                                    {range}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 space-y-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-violet-100 text-sm uppercase tracking-widest flex items-center justify-center gap-2 group"
                                >
                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Ativar minha Locadora <Sparkles className="w-4 h-4 group-hover:scale-125 transition-transform" /></>}
                                </button>
                                <button type="button" onClick={prevStep} className="w-full py-4 text-zinc-400 hover:text-zinc-600 font-bold text-sm transition-colors">
                                    <ArrowLeft className="inline-block mr-2 w-4 h-4" /> Voltar
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <p className="p-8 text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                © {new Date().getFullYear()} Locatus Intelligence — Infraestrutura Empresarial para Locadoras.
            </p>
        </div>
    );
}
