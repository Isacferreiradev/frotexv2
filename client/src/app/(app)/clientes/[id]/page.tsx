'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    User,
    Phone,
    Mail,
    MapPin,
    FileText,
    History,
    DollarSign,
    AlertCircle,
    ArrowLeft,
    Plus,
    MessageSquare,
    PhoneCall,
    Zap,
    ExternalLink,
    Wrench
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/shared/SkeletonLoader';
import { CommunicationTimeline } from '@/components/shared/CommunicationTimeline';
import { RentalCheckout } from '@/components/forms/RentalCheckout';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Customer360Page() {
    const { id } = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isRentalOpen, setIsRentalOpen] = useState(false);

    const { data: customer, isLoading } = useQuery({
        queryKey: ['customer-360', id],
        queryFn: async () => {
            const res = await api.get(`/customers/${id}/360`);
            return res.data.data;
        }
    });

    const createRentalMutation = useMutation({
        mutationFn: (data: any) => api.post('/rentals', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-360', id] });
            setIsRentalOpen(false);
            toast.success('Locação realizada com sucesso!');
        },
        onError: () => toast.error('Erro ao realizar locação'),
    });

    const logCommMutation = useMutation({
        mutationFn: (data: any) => api.post('/client-communications', { customerId: id, ...data }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customer-360', id] });
            toast.success('Interação registrada!');
        }
    });

    if (isLoading) return <div className="p-10 container mx-auto"><Skeleton className="h-[600px] w-full rounded-2xl" /></div>;
    if (!customer) return <div className="p-10 text-center">Cliente não encontrado.</div>;

    const metrics = customer.metrics;

    return (
        <div className="max-w-[1400px] mx-auto py-10 px-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-white hover:shadow-soft transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary text-2xl font-black shadow-sm border border-primary/5">
                            {customer.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-semibold tracking-tight">{customer.fullName}</h1>
                                {customer.isBlocked && <StatusBadge status="blocked" />}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1 lowercase">
                                {customer.email || 'sem email cadastrado'} • {customer.phoneNumber}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 px-6"
                        onClick={() => window.open(`https://wa.me/${customer.phoneNumber?.replace(/\D/g, '')}`, '_blank')}
                    >
                        <MessageSquare className="w-3.5 h-3.5 mr-2" /> Log WhatsApp
                    </Button>
                    <Button
                        className="rounded-xl font-bold text-[10px] uppercase tracking-widest h-11 px-6 shadow-premium"
                        onClick={() => setIsRentalOpen(true)}
                    >
                        <Zap className="w-3.5 h-3.5 mr-2" /> Nova Locação
                    </Button>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Investimento Total', value: formatCurrency(metrics.totalSpent), icon: DollarSign, color: 'text-violet-500', bg: 'bg-violet-50' },
                    { label: 'Locações Ativas', value: metrics.activeRentals, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Histórico Total', value: metrics.totalRentals, icon: History, color: 'text-slate-500', bg: 'bg-slate-50' },
                    { label: 'Saúde de Crédito', value: metrics.hasOverdue ? 'Em Atraso' : 'Regular', icon: AlertCircle, color: metrics.hasOverdue ? 'text-red-500' : 'text-emerald-500', bg: metrics.hasOverdue ? 'bg-red-50' : 'bg-emerald-50' },
                ].map((stat, i) => (
                    <Card key={i} className="rounded-2xl border-border/40 shadow-soft">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={cn("p-2 rounded-xl", stat.bg)}>
                                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="space-y-8">
                <TabsList className="bg-muted/30 p-1.5 rounded-2xl border border-border/40">
                    <TabsTrigger value="overview" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Perfil & CRM</TabsTrigger>
                    <TabsTrigger value="rentals" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Locações ({metrics.totalRentals})</TabsTrigger>
                    <TabsTrigger value="quotes" className="rounded-xl text-[10px] font-bold uppercase tracking-widest px-8">Orçamentos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="outline-none animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-foreground">
                        {/* Profile Info */}
                        <Card className="lg:col-span-2 rounded-2xl border-border/40 shadow-soft">
                            <CardHeader className="border-b border-border/10 bg-muted/5">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ficha Cadastral</CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                <FileText className="w-3 h-3" /> Documentação ({customer.documentType})
                                            </p>
                                            <p className="text-sm font-bold font-mono bg-muted/30 px-3 py-1.5 rounded-lg w-fit">
                                                {customer.documentNumber}
                                            </p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Phone className="w-3 h-3" /> Contato Direto
                                            </p>
                                            <p className="text-sm font-bold">{customer.phoneNumber}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                <Mail className="w-3 h-3" /> E-mail
                                            </p>
                                            <p className="text-sm font-bold lowercase">{customer.email || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                                <MapPin className="w-3 h-3" /> Endereço Principal
                                            </p>
                                            <div className="text-sm font-medium leading-relaxed">
                                                <p className="font-bold">{customer.addressStreet}, {customer.addressNumber}</p>
                                                <p className="text-muted-foreground">{customer.addressNeighborhood} • {customer.addressComplement}</p>
                                                <p className="text-muted-foreground">{customer.addressCity} - {customer.addressState}, {customer.addressZipCode}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-border/10">
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Observações CRM</p>
                                    <p className="text-sm bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 italic text-zinc-700 leading-relaxed">
                                        {customer.notes || 'Nenhuma observação interna registrada.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card className="rounded-2xl border-border/40 shadow-soft">
                            <CardHeader className="border-b border-border/10">
                                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Linha do Tempo (CRM)</CardTitle>
                            </CardHeader>
                            <CardContent className="p-6">
                                <CommunicationTimeline customerId={customer.id as string} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="rentals" className="outline-none animate-in fade-in duration-500">
                    <Card className="rounded-2xl border-border/40 shadow-soft overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/30 border-b border-border/10">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equipamento</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cód / Datas</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Financeiro</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10 text-foreground">
                                    {customer.rentals.map((rental: any) => (
                                        <tr key={rental.id} className="hover:bg-muted/5 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                                                        <Wrench className="w-4 h-4" />
                                                    </div>
                                                    <p className="text-sm font-bold group-hover:text-primary transition-colors">{rental.tool.name}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="font-mono text-[10px] font-bold text-muted-foreground mb-1">{rental.rentalCode}</p>
                                                <p className="text-xs font-medium">{format(new Date(rental.startDate), "dd/MM")} → {format(new Date(rental.endDateExpected), "dd/MM")}</p>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-sm font-bold tracking-tight">{formatCurrency(rental.totalAmountActual || rental.totalAmountExpected)}</p>
                                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                                                    {rental.payments.some((p: any) => p.status === 'completed') ? 'Pago' : 'Pendente'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-5"><StatusBadge status={rental.status} /></td>
                                            <td className="px-6 py-5 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="icon-xs"
                                                    className="rounded-lg"
                                                    onClick={() => router.push(`/locacoes/${rental.id}`)}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="quotes" className="outline-none animate-in fade-in duration-500">
                    <Card className="rounded-2xl border-border/40 shadow-soft py-12 px-8 text-center text-foreground">
                        <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Histórico de Propostas</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-8">Consulte orçamentos enviados e o status de conversão em locações reais.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                            {customer.quotes.map((quote: any) => (
                                <div key={quote.id} className="p-5 rounded-2xl border border-border/40 bg-white hover:shadow-soft transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <StatusBadge status={quote.status} />
                                        <span className="text-[10px] font-bold text-muted-foreground">{format(new Date(quote.createdAt), "dd/MM/yyyy")}</span>
                                    </div>
                                    <p className="text-sm font-bold mb-1">{quote.tool.name}</p>
                                    <p className="text-xl font-black text-primary tracking-tight">{formatCurrency(quote.totalAmount)}</p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <Sheet open={isRentalOpen} onOpenChange={setIsRentalOpen}>
                <SheetContent className="sm:max-w-[700px] border-border/40 p-0 overflow-hidden bg-white shadow-float">
                    <div className="px-10 py-10 border-b border-border/40 bg-muted/10">
                        <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Checkout Contextual</SheetTitle>
                        <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Locação Iniciada para {customer.fullName}</SheetDescription>
                    </div>
                    <div className="p-10">
                        <RentalCheckout
                            initialCustomerId={customer.id as string}
                            onSubmit={(data) => createRentalMutation.mutate(data)}
                            isLoading={createRentalMutation.isPending}
                        />
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
