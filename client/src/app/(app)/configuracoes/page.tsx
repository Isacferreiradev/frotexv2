'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { User, Building2, Shield, Loader2, KeyRound, BadgeCheck, Mail, Calendar, CreditCard, Check, Zap } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConfigTabs } from '@/components/shared/ConfigTabs';
import { formatDate, cn } from '@/lib/utils';
import { Skeleton } from '@/components/shared/SkeletonLoader';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

const profileSchema = z.object({
    fullName: z.string().min(2, 'Nome muito curto'),
    email: z.string().email('E-mail inválido'),
});

const tenantSchema = z.object({
    name: z.string().min(2, 'Nome obrigatório'),
    cnpj: z.string().min(11, 'Documento inválido'),
    contactEmail: z.string().email('E-mail inválido'),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
});

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;
type ProfileValues = z.infer<typeof profileSchema>;
type TenantValues = z.infer<typeof tenantSchema>;

const AVAILABLE_AVATARS = [
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Buddy',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Caleb',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Dusty',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Kiki',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky',
];

function AvatarSelector({ value, onChange }: { value?: string | null, onChange: (val: string) => void }) {
    return (
        <div className="space-y-4">
            <Label className="text-[10px] uppercase font-bold text-zinc-400">Escolha seu Avatar</Label>
            <div className="grid grid-cols-4 gap-3">
                {AVAILABLE_AVATARS.map((url) => (
                    <button
                        key={url}
                        type="button"
                        onClick={() => onChange(url)}
                        className={cn(
                            "relative w-12 h-12 rounded-xl border-2 transition-all overflow-hidden bg-zinc-50 hover:scale-105",
                            value === url ? "border-violet-600 ring-4 ring-violet-50" : "border-transparent"
                        )}
                    >
                        <img src={url} alt="Avatar option" className="w-full h-full object-cover" />
                        {value === url && (
                            <div className="absolute inset-0 bg-violet-600/10 flex items-center justify-center">
                                <BadgeCheck className="w-4 h-4 text-violet-600" />
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

function EditProfileDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);

    const mutation = useMutation({
        mutationFn: (data: ProfileValues) => api.put('/auth/profile', data),
        onSuccess: (res) => {
            toast.success('Perfil atualizado!');
            updateUser(res.data.data);
            setIsOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao atualizar')
    });

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProfileValues & { avatarUrl?: string }>({
        resolver: zodResolver(profileSchema.extend({ avatarUrl: z.string().optional() })),
        defaultValues: {
            fullName: user?.fullName || '',
            email: user?.email || '',
            avatarUrl: user?.avatarUrl || '',
        }
    });

    const currentAvatar = watch('avatarUrl');

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="px-4 py-2 bg-violet-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-100">
                    Editar Perfil
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-[32px] p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                    <DialogTitle className="font-bold text-lg tracking-tight">Editar Perfil</DialogTitle>
                </div>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Nome Completo</Label>
                        <Input {...register('fullName')} className="rounded-xl h-11" />
                        {errors.fullName && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">E-mail</Label>
                        <Input {...register('email')} className="rounded-xl h-11" />
                        {errors.email && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.email.message}</p>}
                    </div>

                    <AvatarSelector
                        value={currentAvatar}
                        onChange={(val) => setValue('avatarUrl', val)}
                    />
                    <button
                        disabled={mutation.isPending}
                        className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditTenantDialog({ tenant }: { tenant: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const mutation = useMutation({
        mutationFn: (data: TenantValues) => api.put('/tenant/info', data),
        onSuccess: () => {
            toast.success('Dados da empresa atualizados!');
            setIsOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao atualizar')
    });

    const { register, handleSubmit, formState: { errors } } = useForm<TenantValues>({
        resolver: zodResolver(tenantSchema),
        defaultValues: {
            name: tenant?.name || '',
            cnpj: tenant?.cnpj || '',
            contactEmail: tenant?.contactEmail || '',
            phoneNumber: tenant?.phoneNumber || '',
            address: tenant?.address || '',
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all">
                    Editar Dados
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[32px] p-0 overflow-hidden">
                <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                    <DialogTitle className="font-bold text-lg tracking-tight">Dados da Instituição</DialogTitle>
                </div>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Razão Social</Label>
                            <Input {...register('name')} className="rounded-xl h-11" />
                            {errors.name && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">CNPJ / CPF</Label>
                            <Input {...register('cnpj')} className="rounded-xl h-11" />
                            {errors.cnpj && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.cnpj.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Telefone</Label>
                            <Input {...register('phoneNumber')} className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">E-mail Corporativo</Label>
                            <Input {...register('contactEmail')} className="rounded-xl h-11" />
                            {errors.contactEmail && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.contactEmail.message}</p>}
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label className="text-[10px] uppercase font-bold text-zinc-400">Endereço Completo</Label>
                            <Input {...register('address')} className="rounded-xl h-11" />
                        </div>
                    </div>
                    <button
                        disabled={mutation.isPending}
                        className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Alterações'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PasswordDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const mutation = useMutation({
        mutationFn: (data: ChangePasswordValues) => api.post('/auth/change-password', data),
        onSuccess: () => {
            toast.success('Senha alterada com sucesso!');
            setIsOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Erro ao alterar senha');
        }
    });

    const { register, handleSubmit, formState: { errors } } = useForm<ChangePasswordValues>({
        resolver: zodResolver(changePasswordSchema)
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="px-6 py-3 bg-white border border-violet-100 rounded-2xl text-[11px] font-bold text-violet-600 uppercase tracking-widest hover:bg-violet-50 transition-all flex items-center gap-2 shadow-sm">
                    <KeyRound className="w-3.5 h-3.5" />
                    Alterar Senha de Acesso
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] rounded-[32px] p-0 overflow-hidden shadow-2xl">
                <div className="px-8 py-6 border-b border-violet-50 bg-violet-50/20">
                    <DialogTitle className="font-bold text-lg tracking-tight">Alterar Senha</DialogTitle>
                </div>
                <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="p-8 space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Senha Atual</Label>
                        <Input type="password" {...register('currentPassword')} className="rounded-xl h-11" />
                        {errors.currentPassword && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.currentPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Nova Senha</Label>
                        <Input type="password" {...register('newPassword')} className="rounded-xl h-11" />
                        {errors.newPassword && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.newPassword.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-zinc-400">Confirmar Nova Senha</Label>
                        <Input type="password" {...register('confirmPassword')} className="rounded-xl h-11" />
                        {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold uppercase">{errors.confirmPassword.message}</p>}
                    </div>
                    <button
                        disabled={mutation.isPending}
                        className="w-full mt-4 bg-violet-600 hover:bg-violet-700 text-white py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-violet-100 flex items-center justify-center gap-2"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar Senha'}
                    </button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function ConfiguracoesPage() {
    const [activeTab, setActiveTab] = useState('perfil');
    const user = useAuthStore((s) => s.user);

    const { data: tenant, isLoading: tenantLoading } = useQuery({
        queryKey: ['tenant-info'],
        queryFn: async () => {
            const res = await api.get('/tenant/info');
            return res.data.data;
        },
        enabled: activeTab === 'empresa'
    });

    return (
        <div className="max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Ajustes do Sistema</h2>
                        <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                            <BadgeCheck className="w-3 h-3" /> Gestão SaaS de Elite
                        </p>
                    </div>
                    <div className="hidden sm:block">
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                            Plano Premium Ativo
                        </div>
                    </div>
                </div>

                <ConfigTabs activeTab={activeTab} onChange={setActiveTab} />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[32px] border border-violet-50 premium-shadow min-h-[500px] overflow-hidden">
                {activeTab === 'perfil' && (
                    <div className="p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-violet-50 rounded-[28px] border-2 border-white shadow-xl shadow-zinc-200 flex items-center justify-center overflow-hidden">
                                    {user?.avatarUrl ? (
                                        <img src={user.avatarUrl} alt="User avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-10 h-10 text-violet-600" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{user?.fullName}</h3>
                                    <p className="text-xs text-zinc-400 font-medium">{user?.email}</p>
                                    <div className="mt-2 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-full w-fit">
                                        {user?.role === 'owner' ? 'Proprietário' : 'Equipe'}
                                    </div>
                                </div>
                            </div>
                            <EditProfileDialog />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-violet-50">
                            {[
                                { label: 'CPF / Identificador', value: '—', icon: Shield },
                                { label: 'Data de Cadastro', value: (user as any)?.createdAt ? formatDate((user as any).createdAt) : '—', icon: Calendar },
                                { label: 'E-mail de Trabalho', value: user?.email, icon: Mail },
                                { label: 'Tenant ID', value: user?.tenantId, icon: Building2, mono: true },
                            ].map((field) => (
                                <div key={field.label} className="space-y-1.5 p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100/50">
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                        <field.icon className="w-3 h-3" /> {field.label}
                                    </div>
                                    <p className={cn("text-sm font-bold text-zinc-800", field.mono && "font-mono text-xs text-violet-500")}>
                                        {field.value}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'empresa' && (
                    <div className="p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-100">
                                    <Building2 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Dados da Instituição</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Identificação Fiscal & Endereço</p>
                                </div>
                            </div>
                            <EditTenantDialog tenant={tenant} />
                        </div>

                        {tenantLoading ? (
                            <div className="space-y-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
                        ) : (
                            <div className="divide-y divide-violet-50">
                                {[
                                    { label: 'Razão Social', value: tenant?.name },
                                    { label: 'CNPJ', value: tenant?.cnpj || '—' },
                                    { label: 'E-mail Corporativo', value: tenant?.contactEmail || '—' },
                                    { label: 'Telefone Principal', value: tenant?.phoneNumber || '—' },
                                    { label: 'Endereço', value: tenant?.address || '—' },
                                ].map((field) => (
                                    <div key={field.label} className="flex items-center justify-between py-5 group">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{field.label}</span>
                                        <span className="text-sm font-bold text-zinc-900 group-hover:text-violet-600 transition-colors">{field.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'seguranca' && (
                    <div className="p-10 space-y-10">
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Segurança da Conta</h3>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Proteção & Credenciais de Acesso</p>
                        </div>

                        <div className="bg-zinc-50 rounded-[28px] p-8 border border-zinc-100 space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-white border border-violet-100 rounded-xl flex items-center justify-center shrink-0">
                                    <KeyRound className="w-5 h-5 text-violet-600" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm text-zinc-900">Senha de Acesso</h4>
                                    <p className="text-xs text-zinc-400 leading-relaxed">Sua senha é criptografada e não pode ser vista. Recomendamos trocá-la a cada 90 dias.</p>
                                </div>
                            </div>
                            <PasswordDialog />
                        </div>
                    </div>
                )}

                {activeTab === 'assinatura' && (
                    <div className="p-10 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <h3 className="text-lg font-bold text-zinc-900 tracking-tight">Gerenciar Assinatura</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Planos, Faturamento & Limites</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-violet-100">
                                <BadgeCheck className="w-3.5 h-3.5" />
                                Plano Atual: {tenant?.plan === 'free' ? 'Gratuito' : tenant?.plan === 'pro' ? 'Profissional' : 'Escala'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                {
                                    id: 'pro',
                                    name: 'Locattus Pro',
                                    price: 'R$ 97/mês',
                                    priceId: 'price_pro_id', // This should match process.env.STRIPE_PRICE_PRO_ID on server
                                    benefits: ['Equipamentos Ilimitados', 'ROI e Inteligência', '3 Usuários', 'Suporte Prioritário'],
                                    popular: true
                                },
                                {
                                    id: 'scale',
                                    name: 'Locattus Scale',
                                    price: 'R$ 197/mês',
                                    priceId: 'price_scale_id',
                                    benefits: ['Tudo do Pro', 'Usuários Ilimitados', 'Multi-Unidade', 'WhatsApp Direto']
                                }
                            ].map((p) => (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "relative group p-8 rounded-[32px] border transition-all duration-300",
                                        tenant?.plan === p.id
                                            ? "bg-violet-600 border-violet-600 text-white shadow-xl shadow-violet-200"
                                            : "bg-white border-zinc-100 hover:border-violet-200 hover:shadow-xl hover:shadow-zinc-100"
                                    )}
                                >
                                    {p.popular && tenant?.plan !== p.id && (
                                        <span className="absolute -top-3 left-8 px-3 py-1 bg-violet-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full">
                                            Recomendado
                                        </span>
                                    )}
                                    <h4 className={cn("text-lg font-bold mb-1", tenant?.plan === p.id ? "text-white" : "text-zinc-900")}>
                                        {p.name}
                                    </h4>
                                    <p className={cn("text-2xl font-black mb-6", tenant?.plan === p.id ? "text-white" : "text-violet-600")}>
                                        {p.price}
                                    </p>

                                    <div className="space-y-4 mb-8">
                                        {p.benefits.map((b) => (
                                            <div key={b} className="flex items-center gap-3">
                                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0", tenant?.plan === p.id ? "bg-white/20" : "bg-violet-50")}>
                                                    <Check className={cn("w-3 h-3", tenant?.plan === p.id ? "text-white" : "text-violet-600")} />
                                                </div>
                                                <span className={cn("text-xs font-medium", tenant?.plan === p.id ? "text-violet-100" : "text-zinc-500")}>
                                                    {b}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {tenant?.plan === p.id ? (
                                        <button disabled className="w-full py-4 bg-white/20 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest cursor-default">
                                            Assinatura Ativa
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                const id = p.id === 'pro' ? 'price_1R53w0RT8R7tLskmN1IEx0E2' : 'price_1R53wVRT8R7tLskmEunF0Iun'; // Real IDs should come from config
                                                toast.promise(api.post('/stripe/checkout', { priceId: id }), {
                                                    loading: 'Iniciando checkout seguro...',
                                                    success: (res) => {
                                                        window.location.href = res.data.data.url;
                                                        return 'Redirecionando...';
                                                    },
                                                    error: 'Erro ao conectar com Stripe. Tente novamente.'
                                                });
                                            }}
                                            className="w-full py-4 bg-violet-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 group-hover:scale-[1.02]"
                                        >
                                            Escolher este Plano
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-8 rounded-[32px] bg-zinc-950 text-white overflow-hidden relative">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-2 text-violet-400">
                                    <Zap className="w-4 h-4 fill-current" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Upgrade Automático</span>
                                </div>
                                <h4 className="text-xl font-bold tracking-tight">Precisa de algo mais robusto?</h4>
                                <p className="text-sm text-zinc-400 max-w-md leading-relaxed">
                                    Nossa equipe de especialistas pode desenhar um plano específico para locadoras com mais de 10 unidades ou necessidades customizadas.
                                </p>
                                <button className="px-6 py-3 bg-white text-zinc-950 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-200 transition-all">
                                    Falar com Consultor
                                </button>
                            </div>
                            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-violet-600/20 blur-[100px] rounded-full" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
