'use client';

import { useState } from 'react';
import {
    Search,
    Users,
    ShieldCheck,
    ShieldAlert,
    Building2,
    Clock,
    MoreHorizontal,
    Mail,
    UserCheck,
    UserX,
    Trash2,
    Calendar,
    Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    const { data: response, isLoading } = useQuery({
        queryKey: ['admin-users', page, search, roleFilter],
        queryFn: async () => (await api.get('/admin/users', {
            params: { page, limit: 15, search, role: roleFilter }
        })).data
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => (await api.put(`/admin/users/${id}`, data)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => (await api.delete(`/admin/users/${id}`)).data,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    });

    const users = response?.data || [];
    const meta = response?.meta || { total: 0, totalPages: 1 };

    const handleToggleStatus = (user: any) => {
        const newStatus = !user.isActive;
        if (window.confirm(`Deseja ${newStatus ? 'ativar' : 'bloquear'} o usuário ${user.fullName}?`)) {
            updateMutation.mutate({ id: user.id, data: { isActive: newStatus } });
        }
    };

    return (
        <div className="p-6 lg:p-10 space-y-8 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gestão Master de Usuários</h1>
                    <p className="text-sm text-slate-500 font-medium">Controle total sobre todos os operadores e administradores de cada locadora.</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Nome, email, ID..."
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs w-64 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Usuário</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Empresa (Tenant)</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Papel & Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">Último Acesso</th>
                                <th className="px-6 py-4 border-b border-slate-100"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-slate-50 rounded w-full" /></td>
                                    </tr>
                                ))
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">Nenhum usuário encontrado.</td>
                                </tr>
                            ) : users.map((user: any) => (
                                <tr key={user.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 font-black text-[10px] group-hover:bg-blue-50 group-hover:text-blue-500 group-hover:border-blue-100 transition-all uppercase">
                                                {user.fullName?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 leading-none">{user.fullName}</p>
                                                <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                                                    <Mail className="w-3 h-3" />
                                                    <span className="text-[10px] font-medium tracking-tight truncate max-w-[150px]">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-3.5 h-3.5 text-slate-300" />
                                            <div>
                                                <p className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">{user.tenantName || 'N/A'}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{user.tenantId?.slice(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center gap-1.5">
                                                {user.role === 'owner' ? (
                                                    <span className="px-2 py-0.5 bg-violet-50 text-violet-600 border border-violet-100 rounded text-[9px] font-black uppercase tracking-widest">Proprietário</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest">Operador</span>
                                                )}

                                                {user.systemRole === 'admin' && (
                                                    <span className="px-2 py-0.5 bg-blue-500 text-white rounded text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                                                        <ShieldCheck className="w-2.5 h-2.5" /> ROOT
                                                    </span>
                                                )}
                                            </div>

                                            {user.isActive ? (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><UserCheck className="w-3 h-3" /> Ativo</span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-[10px] font-bold text-red-500"><UserX className="w-3 h-3" /> Bloqueado</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-slate-600 font-bold flex items-center gap-1.5">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('pt-BR') : 'Nunca logou'}
                                            </p>
                                            <p className="text-[9px] text-slate-400 font-medium">IP: 189.45.XXX.XX (Mock)</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={cn(
                                                    "p-2 rounded-lg transition-all",
                                                    user.isActive ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"
                                                )}
                                                title={user.isActive ? "Bloquear Acesso" : "Ativar Acesso"}
                                            >
                                                {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                            </button>
                                            <button
                                                disabled={user.systemRole === 'admin'}
                                                onClick={() => { if (window.confirm('Excluir permanentemente este usuário?')) deleteMutation.mutate(user.id) }}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                                title="Excluir Usuário"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Total: {meta.total} usuários encontrados
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Anterior
                        </button>
                        <button
                            disabled={page >= meta.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
