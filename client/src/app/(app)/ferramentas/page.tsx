'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, LayoutGrid, List, Wrench, Filter, QrCode, Zap, Folder, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AssetTimeline } from '@/components/shared/AssetTimeline';
import { QRCodeGenerator } from '@/components/shared/QRCodeGenerator';
import { formatCurrency, cn } from '@/lib/utils';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ToolForm } from '@/components/forms/ToolForm';
import { ToolCard } from '@/components/shared/ToolCard';
import { RentalCheckout } from '@/components/forms/RentalCheckout';
import { AvailabilityCalendar } from '@/components/shared/AvailabilityCalendar';
import { CategoryForm } from '@/components/forms/CategoryForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Skeleton, SkeletonCard, SkeletonList } from '@/components/shared/SkeletonLoader';
import { EmptyState } from '@/components/shared/EmptyState';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';

const STATUS_OPTIONS = [
    { value: '', label: 'Todos' },
    { value: 'available', label: 'Disponíveis' },
    { value: 'rented', label: 'Alugados' },
    { value: 'maintenance', label: 'Manutenção' },
];

export default function FerramentasPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<any>(null);
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [qrTool, setQrTool] = useState<any>(null);
    const [isQrOpen, setIsQrOpen] = useState(false);
    const [checkoutTool, setCheckoutTool] = useState<any>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);


    const queryClient = useQueryClient();

    const { data: categories } = useQuery({
        queryKey: ['tool-categories'],
        queryFn: async () => {
            const res = await api.get('/tool-categories');
            return res.data.data;
        }
    });

    const createCategoryMutation = useMutation({
        mutationFn: (data: any) => api.post('/tool-categories', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tool-categories'] });
            toast.success('Categoria criada!');
        },
        onError: () => toast.error('Erro ao criar categoria'),
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.put(`/tool-categories/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tool-categories'] });
            setEditingCategory(null);
            toast.success('Categoria atualizada!');
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/tool-categories/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tool-categories'] });
            toast.success('Categoria removida!');
        },
        onError: () => toast.error('Não é possível remover categoria em uso'),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['tools', statusFilter, categoryFilter, search],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.set('status', statusFilter);
            if (categoryFilter) params.set('categoryId', categoryFilter);
            if (search) params.set('search', search);
            const res = await api.get(`/tools?${params}`);
            return res.data.data;
        },
    });

    const { data: history, isLoading: isHistoryLoading } = useQuery({
        queryKey: ['tool-history', editingTool?.id],
        queryFn: async () => {
            if (!editingTool) return [];
            const res = await api.get(`/activity/logs?entityId=${editingTool.id}&entityType=tool`);
            return res.data.data.map((log: any) => ({
                id: log.id,
                type: log.action === 'create' ? 'created' : log.action === 'update' ? 'status_change' : 'status_change',
                date: log.createdAt,
                user: log.user?.fullName,
                description: log.description,
                metadata: log.details
            }));
        },
        enabled: !!editingTool && isSheetOpen
    });

    const createMutation = useMutation({
        mutationFn: (data: any) => api.post('/tools', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setIsCreateOpen(false);
            toast.success('Equipamento cadastrado!');
        },
        onError: () => toast.error('Erro ao cadastrar equipamento'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.put(`/tools/${editingTool?.id || data.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setIsSheetOpen(false);
            setEditingTool(null);
            toast.success('Equipamento atualizado!');
        },
        onError: () => toast.error('Erro ao atualizar equipamento'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/tools/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== (editingTool?.id || '')));
            toast.success('Equipamento removido');
        },
        onError: () => toast.error('Erro ao remover equipamento'),
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids: string[]) => api.post('/tools/bulk-delete', { ids }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setSelectedIds([]);
            toast.success(`${selectedIds.length} equipamentos removidos`);
        },
        onError: () => toast.error('Erro ao remover equipamentos em massa'),
    });

    const quickStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string, status: string }) =>
            api.put(`/tools/${id}`, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            toast.success('Status atualizado');
        }
    });

    const createRentalMutation = useMutation({
        mutationFn: (data: any) => api.post('/rentals', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rentals'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
            setIsCheckoutOpen(false);
            setCheckoutTool(null);
            toast.success('Locação realizada com sucesso!');
        },
        onError: () => toast.error('Erro ao realizar locação'),
    });


    return (
        <div className="space-y-8 lg:space-y-12 max-w-[1600px] mx-auto py-6 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-1000" >
            {/* ── Header Area ── */}
            < div className="flex flex-col md:flex-row md:items-end justify-between gap-8" >
                <div>
                    <h1 className="text-4xl font-semibold text-foreground tracking-tight">Inventário Inteligente</h1>
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-[0.2em] flex items-center gap-2 mt-3">
                        <Wrench className="w-3.5 h-3.5" /> Gestão de Ativos Premium
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <Dialog open={isCategoriesOpen} onOpenChange={setIsCategoriesOpen}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-3 bg-white hover:bg-slate-50 text-violet-600 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all border border-violet-100 shadow-premium">
                                <Folder className="w-3.5 h-3.5" />
                                Categorias
                            </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] border-violet-50 overflow-hidden p-0">
                            <div className="px-6 md:px-8 py-5 md:py-6 border-b border-violet-50 bg-violet-50/20">
                                <DialogTitle className="font-bold text-xl text-zinc-900">Gerenciar Categorias</DialogTitle>
                            </div>
                            <div className="p-6 md:p-8 space-y-8">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Nova Categoria / Editar</h4>
                                    <CategoryForm
                                        initialData={editingCategory}
                                        onSubmit={(data) => {
                                            if (editingCategory) {
                                                updateCategoryMutation.mutate({ id: editingCategory.id, data });
                                            } else {
                                                createCategoryMutation.mutate(data);
                                            }
                                        }}
                                        isLoading={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                                    />
                                    {editingCategory && (
                                        <button
                                            onClick={() => setEditingCategory(null)}
                                            className="text-[10px] font-bold text-zinc-400 underline hover:text-zinc-600"
                                        >
                                            Cancelar edição
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4 pt-8 border-t border-violet-50">
                                    <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">Categorias Existentes</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {categories?.map((cat: any) => (
                                            <div key={cat.id} className="flex items-center justify-between p-3 rounded-xl border border-violet-50 bg-slate-50/50 hover:bg-white transition-colors">
                                                <span className="text-sm font-bold text-zinc-700">{cat.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setEditingCategory(cat)}
                                                        className="p-1.5 hover:bg-violet-50 text-violet-400 hover:text-violet-600 rounded-lg"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Deseja excluir esta categoria? Isso só funcionará se ela não estiver em uso.')) {
                                                                deleteCategoryMutation.mutate(cat.id);
                                                            }
                                                        }}
                                                        className="p-1.5 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="bg-secondary/30 p-1.5 rounded-xl flex items-center gap-1 border border-primary/5">

                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-200",
                                viewMode === 'grid' ? "bg-white text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={cn(
                                "p-2 rounded-lg transition-all duration-200",
                                viewMode === 'table' ? "bg-white text-primary shadow-soft" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-[11px] uppercase tracking-widest transition-all shadow-premium">
                                <Plus className="w-4.5 h-4.5" />
                                Novo Item
                            </button>
                        </DialogTrigger>
                        <SheetContent className="sm:max-w-[600px] border-border/40 p-0 overflow-hidden bg-white flex flex-col h-full shadow-float text-foreground">
                            <div className="px-6 md:px-10 py-8 md:py-10 border-b border-border/40 bg-muted/10">
                                <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Novo Ativo</SheetTitle>
                                <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Cadastro de Ficha Técnica Completa</SheetDescription>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 md:p-10 mt-0 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="space-y-8">
                                    <ToolForm
                                        onSubmit={(data) => createMutation.mutate(data)}
                                        isLoading={createMutation.isPending}
                                    />
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div >

            {/* ── Filter Bar (Stripe-like) ── */}
            < div className="bg-white p-6 rounded-2xl border border-border/40 shadow-soft space-y-6" >
                <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar ferramenta, marca ou patrimônio..."
                            className="w-full pl-12 pr-4 py-3 bg-muted/30 border-none rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-xl border border-border/40 overflow-x-auto no-scrollbar">
                        {STATUS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                                    statusFilter === opt.value
                                        ? "bg-white text-primary shadow-soft"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                    <button
                        onClick={() => setCategoryFilter('')}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all",
                            categoryFilter === ''
                                ? "bg-foreground border-foreground text-white"
                                : "bg-white border-border/40 text-muted-foreground hover:border-primary/20 hover:text-primary"
                        )}
                    >
                        <Filter className="w-3 h-3" /> Todas Categorias
                    </button>
                    {categories?.map((cat: any) => (
                        <button
                            key={cat.id}
                            onClick={() => setCategoryFilter(cat.id)}
                            className={cn(
                                "px-5 py-2.5 rounded-full border text-[10px] font-semibold uppercase tracking-widest transition-all",
                                categoryFilter === cat.id
                                    ? "bg-primary border-primary text-white shadow-premium"
                                    : "bg-white border-border/40 text-muted-foreground hover:border-primary/20 hover:text-primary"
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div >

            {/* ── Content Area ── */}
            {
                isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
                        {Array(8).fill(0).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : data?.length === 0 ? (
                    <div className="mt-16">
                        <EmptyState
                            icon={Wrench}
                            title="Nenhum item encontrado"
                            description="Tente ajustar seus filtros ou cadastre um novo equipamento no inventário."
                        />
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
                        {data.map((tool: any, index: number) => (
                            <motion.div
                                key={tool.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <ToolCard
                                    tool={tool}
                                    selected={selectedIds.includes(tool.id)}
                                    onSelect={(id) => {
                                        setSelectedIds(prev =>
                                            prev.includes(id)
                                                ? prev.filter(i => i !== id)
                                                : [...prev, id]
                                        );
                                    }}
                                    onEdit={(t) => {
                                        setEditingTool(t);
                                        setIsSheetOpen(true);
                                    }}
                                    onStatusChange={(id, status) => quickStatusMutation.mutate({ id, status })}
                                    onShowQR={(t) => {
                                        setQrTool(t);
                                        setIsQrOpen(true);
                                    }}
                                    onCheckout={(t) => {
                                        setCheckoutTool(t);
                                        setIsCheckoutOpen(true);
                                    }}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="mt-8">
                        <DataTable
                            data={data}
                            isLoading={isLoading}
                            onSearchChange={(val) => setSearch(val)}
                            onRowClick={(tool) => router.push(`/ferramentas/${tool.id}`)}
                            columns={[
                                {
                                    header: "Equipamento",
                                    accessorKey: "name",
                                    cell: (tool: any) => (
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                                                <Wrench className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground tracking-tight">{tool.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-tight">{tool.brand} • {tool.assetTag}</p>
                                            </div>
                                        </div>
                                    )
                                },
                                {
                                    header: "Categoria",
                                    accessorKey: "categoryName",
                                    cell: (tool: any) => (
                                        <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                                            {tool.categoryName || 'Geral'}
                                        </span>
                                    )
                                },
                                {
                                    header: "Diária",
                                    accessorKey: "dailyRate",
                                    cell: (tool: any) => formatCurrency(tool.dailyRate)
                                },
                                {
                                    header: "Status",
                                    accessorKey: "status",
                                    cell: (tool: any) => <StatusBadge status={tool.status} />
                                },
                                {
                                    header: "Gestão",
                                    accessorKey: "id",
                                    className: "text-right",
                                    cell: (tool: any) => (
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon-xs"
                                                onClick={() => {
                                                    setQrTool(tool);
                                                    setIsQrOpen(true);
                                                }}
                                                className="rounded-lg"
                                            >
                                                <QrCode className="w-3.5 h-3.5" />
                                            </Button>
                                            {tool.status === 'available' && (
                                                <Button
                                                    variant="default"
                                                    size="xs"
                                                    onClick={() => {
                                                        setCheckoutTool(tool);
                                                        setIsCheckoutOpen(true);
                                                    }}
                                                    className="rounded-lg h-7 px-3 text-[9px] uppercase font-bold tracking-widest"
                                                >
                                                    <Zap className="w-3 h-3 mr-1" />
                                                    Alugar
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="icon-xs"
                                                onClick={() => {
                                                    setEditingTool(tool);
                                                    setIsSheetOpen(true);
                                                }}
                                                className="rounded-lg"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon-xs"
                                                onClick={() => {
                                                    if (confirm(`Excluir "${tool.name}"?`)) {
                                                        deleteMutation.mutate(tool.id);
                                                    }
                                                }}
                                                className="hover:text-red-500 hover:border-red-200 rounded-lg"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    )
                                }
                            ]}
                        />
                    </div>
                )
            }

            {/* ── Overlays (Sheets/Modals) ── */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetContent className="sm:max-w-[600px] border-border/40 p-0 overflow-hidden bg-white flex flex-col h-full shadow-float text-foreground">
                    <div className="px-6 md:px-10 py-8 md:py-10 border-b border-border/40 bg-muted/10">
                        <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Gestão do Ativo</SheetTitle>
                        <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Histórico & Configurações de Ciclo de Vida</SheetDescription>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-10">
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-10 bg-slate-100/50 p-1.5 rounded-2xl border border-violet-50">
                                <TabsTrigger value="details" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm text-[10px] font-extrabold uppercase tracking-widest">
                                    Ficha Técnica
                                </TabsTrigger>
                                <TabsTrigger value="availability" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm text-[10px] font-extrabold uppercase tracking-widest">
                                    Disponibilidade
                                </TabsTrigger>
                                <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm text-[10px] font-extrabold uppercase tracking-widest">
                                    Timeline
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="details" className="mt-0 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="space-y-8">
                                    <ToolForm
                                        initialData={editingTool}
                                        onSubmit={(data) => updateMutation.mutate(data)}
                                        isLoading={updateMutation.isPending}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="availability" className="mt-0 animate-in fade-in slide-in-from-left-4 duration-300">
                                {editingTool?.id && <AvailabilityCalendar toolId={editingTool.id} />}
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 animate-in fade-in slide-in-from-left-4 duration-300">
                                <div className="space-y-8">
                                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Timeline de Atividades
                                    </h3>
                                    <AssetTimeline events={history || []} loading={isHistoryLoading} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                </SheetContent>
            </Sheet>

            <Dialog open={isQrOpen} onOpenChange={setIsQrOpen}>
                <DialogContent className="sm:max-w-[400px] rounded-2xl border-border/40 p-0 overflow-hidden shadow-float">
                    <div className="px-8 py-8 border-b border-border/40 bg-muted/10 text-center">
                        <DialogTitle className="font-semibold text-lg tracking-tight text-foreground">Identificador Digital</DialogTitle>
                    </div>
                    <div className="p-10">
                        {qrTool && (
                            <QRCodeGenerator
                                value={`https://frotex.app/asset/${qrTool.id}`}
                                label={qrTool.name}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Sheet open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <SheetContent className="sm:max-w-[700px] border-border/40 p-0 overflow-hidden bg-white shadow-float">
                    <div className="px-6 md:px-10 py-8 md:py-10 border-b border-border/40 bg-muted/10">
                        <SheetTitle className="font-semibold text-2xl tracking-tight text-foreground">Checkout Expresso</SheetTitle>
                        <SheetDescription className="text-primary font-semibold text-[10px] uppercase tracking-[0.2em] mt-2">Geração de Contrato & Saída Registrada</SheetDescription>
                    </div>
                    <div className="p-6 md:p-10">
                        <RentalCheckout
                            initialToolId={checkoutTool?.id}
                            onSubmit={(data) => createRentalMutation.mutate(data)}
                            isLoading={createRentalMutation.isPending}
                        />
                    </div>
                </SheetContent>
            </Sheet>

            {/* Bulk Action Bar */}
            <AnimatePresence>
                {selectedIds.length > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6 px-8 py-4 bg-zinc-900 text-white rounded-3xl shadow-float border border-white/10 backdrop-blur-xl"
                    >
                        <div className="flex items-center gap-3 pr-6 border-r border-white/10">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs ring-4 ring-primary/20 animate-pulse">
                                {selectedIds.length}
                            </div>
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Selecionados</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-zinc-400 hover:text-white hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest"
                                onClick={() => setSelectedIds([])}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-[10px] font-bold uppercase tracking-widest px-6 h-10 rounded-xl transition-all"
                                onClick={() => {
                                    if (confirm(`Deseja excluir ${selectedIds.length} equipamentos?`)) {
                                        bulkDeleteMutation.mutate(selectedIds);
                                    }
                                }}
                                disabled={bulkDeleteMutation.isPending}
                            >
                                {bulkDeleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Trash2 className="w-3 h-3 mr-2" />}
                                Excluir Todos
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
}
