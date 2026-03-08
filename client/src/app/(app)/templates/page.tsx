'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileSignature, Edit, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

export default function TemplatesPage() {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { },
    });
    const queryClient = useQueryClient();

    const { data: templates, isLoading } = useQuery({
        queryKey: ['contract-templates'],
        queryFn: async () => (await api.get('/contract-templates')).data.data,
    });

    const mutation = useMutation({
        mutationFn: async (vars: any) => {
            if (vars.id) return api.put(`/contract-templates/${vars.id}`, vars);
            return api.post('/contract-templates', vars);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
            setIsEditorOpen(false);
            setSelectedTemplate(null);
            toast.success(selectedTemplate ? 'Template atualizado' : 'Template criado');
        },
        onError: () => toast.error('Erro ao salvar template'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/contract-templates/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contract-templates'] });
            toast.success('Template removido');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Erro ao remover template'),
    });

    const handleEdit = (template: any) => {
        setSelectedTemplate(template);
        setIsEditorOpen(true);
    };

    const handleCreate = () => {
        setSelectedTemplate(null);
        setIsEditorOpen(true);
    };

    return (
        <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-700">
            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Templates de Contrato</h2>
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest flex items-center gap-2">
                        <FileSignature className="w-3 h-3" /> Personalização de Documentos Jurídicos
                    </p>
                </div>

                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-violet-200"
                >
                    <Plus className="w-4 h-4" />
                    Novo Template
                </button>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-48 rounded-[28px]" />)}
                </div>
            ) : !templates?.length ? (
                <EmptyState
                    icon={FileSignature}
                    title="Nenhum template encontrado"
                    description="Crie seu primeiro modelo de contrato para automatizar suas locações."
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template: any) => (
                        <div key={template.id} className="group bg-white rounded-[28px] border border-violet-50 p-6 premium-shadow hover-scale flex flex-col h-full">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100 group-hover:bg-violet-600 group-hover:border-violet-600 transition-all duration-300">
                                    <FileSignature className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                                </div>
                                {template.isDefault && (
                                    <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5 shadow-sm">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Padrão</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-zinc-900 text-lg tracking-tight mb-2 truncate">{template.name}</h3>
                                <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed">
                                    {(template.content || '').replace(/{{.*?}}/g, '___')}
                                </p>
                            </div>

                            <div className="mt-6 flex gap-2">
                                <button
                                    onClick={() => handleEdit(template)}
                                    className="flex-1 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-3 h-3" /> Editar
                                </button>
                                {!template.isDefault && (
                                    <button
                                        onClick={() => {
                                            setConfirmModal({
                                                isOpen: true,
                                                title: 'Excluir Template',
                                                description: `Deseja excluir o template "${template.name}"? Esta ação não pode ser desfeita.`,
                                                onConfirm: () => {
                                                    deleteMutation.mutate(template.id);
                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                }
                                            });
                                        }}
                                        className="w-11 h-11 bg-white border border-red-50 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl flex items-center justify-center transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Sheet open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                <SheetContent className="sm:max-w-[800px] border-violet-50 p-0 overflow-hidden bg-white flex flex-col">
                    <div className="px-10 py-8 border-b border-violet-50 bg-violet-50/20">
                        <SheetTitle className="font-bold text-2xl tracking-tight text-zinc-900">
                            {selectedTemplate ? 'Editar Template' : 'Novo Template de Contrato'}
                        </SheetTitle>
                        <SheetDescription className="text-violet-500 font-bold text-[10px] uppercase tracking-widest mt-1">
                            Use variáveis como {"{{cliente}}"}, {"{{ferramenta}}"}, {"{{valor}}"}
                        </SheetDescription>
                    </div>

                    <form
                        onSubmit={(e: any) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            mutation.mutate({
                                id: selectedTemplate?.id,
                                name: formData.get('name'),
                                content: formData.get('content'),
                                isDefault: formData.get('isDefault') === 'on',
                            });
                        }}
                        className="flex-1 overflow-y-auto p-10 space-y-6"
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Nome do Template</label>
                            <input
                                name="name"
                                required
                                defaultValue={selectedTemplate?.name}
                                placeholder="Ex: Contrato Padrão de Ferramentas"
                                className="w-full px-5 py-3.5 rounded-2xl border border-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-100 text-sm font-medium bg-white premium-shadow"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Conteúdo do Contrato</label>
                                <span className="text-[9px] font-medium text-zinc-400 italic">Formato texto livre</span>
                            </div>
                            <textarea
                                name="content"
                                required
                                defaultValue={selectedTemplate?.content}
                                rows={15}
                                placeholder="Pelo presente contrato, a {{empresa}} loca para {{cliente}} o equipamento {{ferramenta}}..."
                                className="w-full px-5 py-4 rounded-2xl border border-violet-50 focus:outline-none focus:ring-2 focus:ring-violet-100 text-sm font-medium bg-white premium-shadow leading-relaxed resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-violet-50/30 rounded-2xl border border-violet-100/50">
                            <input
                                type="checkbox"
                                name="isDefault"
                                id="isDefault"
                                defaultChecked={selectedTemplate?.isDefault}
                                className="w-4 h-4 rounded border-violet-200 text-violet-600 focus:ring-violet-500"
                            />
                            <label htmlFor="isDefault" className="text-xs font-bold text-zinc-600 cursor-pointer">Definir como template padrão para novas locações</label>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                            <div>
                                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Variáveis Disponíveis</p>
                                <p className="text-[11px] text-amber-600 leading-tight">
                                    {"{{empresa}}, {{cliente}}, {{documento}}, {{ferramenta}}, {{valor_dia}}, {{valor_total}}, {{data_inicio}}, {{data_fim}}"}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-4">
                            <button
                                type="button"
                                onClick={() => setIsEditorOpen(false)}
                                className="flex-1 px-4 py-4 rounded-2xl border border-violet-50 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 transition-all font-bold"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={mutation.isPending}
                                className="flex-[2] px-4 py-4 rounded-2xl bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-100 flex items-center justify-center font-bold"
                            >
                                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar Template'}
                            </button>
                        </div>
                    </form>
                </SheetContent>
            </Sheet>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}
