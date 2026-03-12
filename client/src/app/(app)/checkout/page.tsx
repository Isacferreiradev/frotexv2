'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
    ShieldCheck,
    CheckCircle2,
    ChevronLeft,
    QrCode,
    Info,
    ArrowRight,
    Loader2,
    Copy,
    Check,
    Zap,
    Lock,
    UserCircle,
    Mail,
    IdCard,
    Sparkles,
    Phone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';

const PLANS_INFO: Record<string, any> = {
    'pro': {
        name: 'Locattus Pro',
        price: '97,00',
        description: 'Ideal para locadoras em crescimento.',
        benefits: ['Equipamentos Ilimitados', 'ROI e Inteligência', '3 Usuários', 'Suporte Prioritário'],
        color: 'from-violet-600 to-indigo-600'
    },
    'premium': {
        name: 'Locattus Premium',
        price: '197,00',
        description: 'A solução definitiva para grandes operações.',
        benefits: ['Tudo do Pro', 'Usuários Ilimitados', 'Multi-Unidade', 'WhatsApp Direto'],
        color: 'from-amber-500 to-orange-600'
    },
    'scale': {
        name: 'Locattus Scale',
        price: '397,00',
        description: 'Escalabilidade sem limites para franquias.',
        benefits: ['Tudo do Premium', 'API de Integração', 'Account Manager', 'Customização White-label'],
        color: 'from-blue-600 to-cyan-500'
    }
};

export default function CheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const user = useAuthStore(s => s.user);
    const planId = searchParams.get('plan') || 'pro';
    const plan = PLANS_INFO[planId] || PLANS_INFO.pro;

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: user?.fullName || '',
        email: user?.email || '',
        taxId: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [charge, setPendingCharge] = useState<any>(null);
    const [isCopying, setIsCopying] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
    const [currentTenantPlan, setCurrentTenantPlan] = useState<string | null>(null);
    const [pageLoading, setPageLoading] = useState(true);

    // Initial Load: Fetch current plan & active charges
    useEffect(() => {
        const initCheckout = async () => {
            setPageLoading(true);
            try {
                // 1. Fetch current tenant plan to prevent re-purchasing
                const tenantRes = await api.get('/tenant/info');
                const plan = tenantRes.data?.data?.plan;
                setCurrentTenantPlan(plan);

                // 2. Check for active pending charges
                const chargeRes = await api.get('/billing/active');
                if (chargeRes.data?.success && chargeRes.data.data) {
                    const activeCharge = chargeRes.data.data;

                    // SMART AUTO-RESUME: Only resume if for same plan AND user hasn't paid yet
                    if (activeCharge.planRequested === planId && plan !== planId) {
                        setPendingCharge(activeCharge);
                        setStep(2);
                    }
                }
            } catch (error) {
                console.error('Checkout initialization failed:', error);
            } finally {
                setPageLoading(false);
            }
        };
        initCheckout();
    }, [planId]);

    useEffect(() => {
        if (!charge || paymentStatus !== 'pending') return;

        const poll = setInterval(async () => {
            try {
                const response = await api.get(`/billing/charge/${charge.id}`);

                if (response.data?.data?.status === 'paid') {
                    setPaymentStatus('paid');
                    clearInterval(poll);
                    toast.success('Assinatura confirmada!');
                    setTimeout(() => router.push('/configuracoes?tab=assinatura'), 3000);
                }
            } catch (error: any) {
                console.error('Polling error:', error.response?.data || error.message);
            }
        }, 5000);

        return () => clearInterval(poll);
    }, [charge, paymentStatus, router]);

    const handleInitiatePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.taxId) return toast.error('CPF ou CNPJ é obrigatório');
        if (!formData.phone) return toast.error('Telefone é obrigatório');

        setLoading(true);
        try {
            const response = await api.post('/billing/upgrade', {
                planRequested: planId,
                customer: {
                    name: formData.name,
                    email: formData.email,
                    taxId: formData.taxId.replace(/\D/g, ''),
                    phone: formData.phone.replace(/\D/g, '')
                }
            });
            if (response.data?.success) {
                setPendingCharge(response.data.data);
                setStep(2);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao processar checkout');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!charge?.brCode) return;
        navigator.clipboard.writeText(charge.brCode);
        setIsCopying(true);
        toast.success('Código PIX copiado!');
        setTimeout(() => setIsCopying(false), 2000);
    };

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-6">
                <Loader2 className="w-8 h-8 animate-spin text-slate-200" />
            </div>
        );
    }

    if (currentTenantPlan === planId && paymentStatus !== 'paid') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 border border-emerald-100">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Você já é {plan.name}!</h1>
                <p className="text-slate-500 max-w-sm mb-8 font-medium">
                    Sua assinatura atual já contempla todos os recursos deste plano. Não é necessário realizar um novo pagamento.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                >
                    Voltar ao Início <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        );
    }

    if (paymentStatus === 'paid') {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center overflow-hidden relative">
                {/* Geometric Confetti Effect */}
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(40)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute opacity-80"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `-5%`,
                                width: `${Math.random() * 10 + 5}px`,
                                height: `${Math.random() * 20 + 10}px`,
                                backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
                                transform: `rotate(${Math.random() * 360}deg)`,
                                animation: `confetti-fall ${2 + Math.random() * 3}s linear forwards`,
                                animationDelay: `${Math.random() * 2}s`
                            }}
                        />
                    ))}
                </div>

                <style>{`
                    @keyframes confetti-fall {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                    }
                `}</style>

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.05)_0%,_transparent_70%)] pointer-events-none" />

                <div className="relative animate-in zoom-in-50 duration-700">
                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl animate-pulse" />
                    <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-700" />

                    <div className="w-24 h-24 bg-white text-emerald-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-200/50 border border-emerald-100 flex-shrink-0 relative z-10 mx-auto">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                </div>

                <div className="relative z-10 space-y-4 max-w-lg mb-12 animate-in slide-in-from-bottom-6 duration-1000 delay-300">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" />
                        <span className="text-xs font-black text-amber-500 uppercase tracking-[0.3em]">Upgrade Confirmado</span>
                        <Sparkles className="w-5 h-5 text-amber-400 animate-bounce delay-150" />
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Seja bem-vindo ao <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-emerald-600">topo</span>!
                    </h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Sua jornada no <b>{plan.name}</b> começou. Sua conta foi atualizada instantaneamente e todos os recursos exclusivos já estão liberados para você.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-12 animate-in slide-in-from-bottom-12 duration-1000 delay-500">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 group hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all cursor-default">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-5 h-5 fill-current" />
                        </div>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Acesso Total</h3>
                        <p className="text-xs text-slate-500 font-medium">Todos os módulos premium do plano {plan.name} já estão ativos.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-left space-y-2 group hover:bg-white hover:shadow-xl hover:border-emerald-100 transition-all cursor-default">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Suporte Prioritário</h3>
                        <p className="text-xs text-slate-500 font-medium">Nossa equipe de especialistas está pronta para te ajudar a escalar.</p>
                    </div>
                </div>

                <button
                    onClick={() => router.push('/dashboard')}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-2xl shadow-slate-300 hover:scale-105 active:scale-95 animate-in slide-in-from-bottom-20 duration-1000 delay-700"
                >
                    Explorar meu novo painel <ArrowRight className="w-5 h-5" />
                </button>

                <p className="mt-8 text-[10px] font-black text-slate-300 uppercase tracking-widest animate-in fade-in duration-1000 delay-1000">Locattus Payment Protection</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] selection:bg-slate-900 selection:text-white">
            {/* Header Moderno e Clean */}
            <header className="px-8 py-6 max-w-[1400px] mx-auto flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="group flex items-center gap-3 py-2 px-4 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200"
                >
                    <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    <span className="text-[11px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-widest transition-colors">Voltar</span>
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                        <Zap className="w-5 h-5 text-white fill-current" />
                    </div>
                </div>

                <div className="hidden sm:flex items-center gap-5">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/5 rounded-full border border-slate-900/5">
                        <Lock className="w-3 h-3 text-slate-500" />
                        <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">Secure Checkout</span>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 p-6 lg:p-12 items-start mt-4">

                {/* Coluna da Esquerda: O Formulário */}
                <div className="lg:col-span-7 space-y-10 order-2 lg:order-1 animate-in slide-in-from-bottom-6 fade-in duration-1000">

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Passo {step} de 2</span>
                            <div className="h-px w-12 bg-slate-200" />
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                            {step === 1 ? 'Configure sua assinatura.' : 'Pagamento via PIX.'}
                        </h2>
                        <p className="text-base text-slate-500 font-medium max-w-md leading-relaxed">
                            {step === 1
                                ? 'Dados de faturamento necessários para ativar sua conta pro.'
                                : 'Escaneie o QR Code abaixo para confirmação instantânea.'}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleInitiatePayment} className="space-y-8 p-8 lg:p-10 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] relative overflow-hidden group">
                            {/* Efeito sutil de brilho no topo */}
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent" />

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 ml-1">
                                        <UserCircle className="w-4 h-4 text-slate-400" />
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome ou Razão Social</label>
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full text-lg font-bold py-4 px-6 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900"
                                        placeholder="Seu nome completo"
                                    />
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-[1.5] space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <Mail className="w-4 h-4 text-slate-400" />
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail de Faturamento</label>
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full text-base font-bold py-4 px-6 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900"
                                            placeholder="seu@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <IdCard className="w-4 h-4 text-slate-400" />
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CPF ou CNPJ</label>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={formData.taxId}
                                            onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                            className="w-full text-base font-bold py-4 px-6 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-2 ml-1">
                                            <Phone className="w-4 h-4 text-slate-400" />
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone / WhatsApp</label>
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full text-base font-bold py-4 px-6 rounded-xl bg-slate-50 border-2 border-transparent focus:border-slate-900 focus:bg-white outline-none transition-all placeholder:text-slate-300 text-slate-900"
                                            placeholder="(00) 00000-0000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-4 active:scale-[0.98] disabled:opacity-50 group"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                    <>
                                        Gerar Pagamento
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-2">
                                Ativação instantânea após confirmação
                            </p>
                        </form>
                    ) : (
                        <div className="p-10 bg-white rounded-[2.5rem] border border-slate-200/60 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.1)] flex flex-col items-center space-y-10 animate-in zoom-in-95 duration-700">

                            <div className="relative group p-4 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <div className="relative p-7 bg-white rounded-[2rem] border-2 border-slate-900 shadow-2xl">
                                    <img
                                        src={charge.brCodeBase64}
                                        alt="PIX QR Code"
                                        className="w-52 h-52"
                                    />
                                </div>
                            </div>

                            <div className="w-full space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">PIX Copia e Cola</label>
                                        <span className="text-[10px] font-black text-emerald-500 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                            Detectando Pagamento
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-slate-400 text-xs font-mono break-all line-clamp-2">
                                            {charge.brCode}
                                        </div>
                                        <button
                                            onClick={copyToClipboard}
                                            className="w-14 h-14 bg-slate-950 text-white flex items-center justify-center rounded-xl hover:bg-slate-800 transition-all active:scale-90 shadow-lg shadow-slate-200 shrink-0"
                                        >
                                            {isCopying ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-2xl w-full">
                                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Aguardando confirmação...</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setPendingCharge(null);
                                            setStep(1);
                                        }}
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors py-2"
                                    >
                                        Escolher outro plano ou corrigir dados
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Coluna da Direita: Resumo Dinâmico */}
                <div className="lg:col-span-5 order-1 lg:order-2">
                    <div className="sticky top-28 space-y-8">

                        <div className={cn(
                            "rounded-[2.5rem] p-8 lg:p-10 text-white shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] relative overflow-hidden bg-gradient-to-br",
                            plan.color
                        )}>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[90px] rounded-full -mr-32 -mt-32" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 blur-[40px] rounded-full -ml-16 -mb-16" />

                            <div className="relative z-10 space-y-8">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="px-3 py-1 bg-white/20 rounded-full border border-white/20 backdrop-blur-sm">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white">Plano Selecionado</span>
                                        </div>
                                        {planId === 'premium' && (
                                            <div className="px-3 py-1 bg-yellow-400/20 rounded-full border border-yellow-400/20 backdrop-blur-sm">
                                                <Sparkles className="w-3 h-3 text-yellow-300 inline mr-1" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">Mais Vantajoso</span>
                                            </div>
                                        )}
                                    </div>
                                    <h4 className="text-4xl font-black tracking-tight">{plan.name}</h4>
                                </div>

                                <div className="space-y-4 py-6 border-y border-white/10">
                                    {plan.benefits.map((benefit: string) => (
                                        <div key={benefit} className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0 border border-white/10">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                            <span className="text-sm font-bold text-white/90">{benefit}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2">
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <span className="block text-[9px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Total a pagar</span>
                                            <div className="text-5xl font-black tracking-tight">R$ {plan.price}</div>
                                        </div>
                                        <div className="text-right pb-1">
                                            <p className="text-[9px] font-black text-white bg-black/20 px-3 py-1 rounded-lg border border-white/10 uppercase tracking-widest">Single Payment</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Detalhes de Segurança Extra Clean */}
                        <div className="px-6 py-4 rounded-2xl bg-white border border-slate-200 flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-slate-100">
                                <ShieldCheck className="w-5 h-5 text-slate-900" />
                            </div>
                            <div className="space-y-0.5">
                                <h5 className="text-[9px] font-black text-slate-950 uppercase tracking-[0.2em]">Compra Segura</h5>
                                <p className="text-[10px] font-medium text-slate-500 leading-normal">
                                    Via <b>AbacatePay</b> com SSL 256-bit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <div className="h-20" />
        </div>
    );
}
