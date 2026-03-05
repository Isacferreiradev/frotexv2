'use client';

import { useQuery } from '@tanstack/react-query';
import { History, User, FileText, Wrench, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import api from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from './EmptyState';

const actionIcons: Record<string, any> = {
    'CREATE_RENTAL': FileText,
    'RETURN_RENTAL': CheckCircle2,
    'CREATE_CUSTOMER': User,
    'UPDATE_TOOL': Wrench,
    'MAINTENANCE_LOG': Wrench,
    'LOGIN': Clock,
};

export function ActivityLogsViewer() {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['activity-logs'],
        queryFn: async () => {
            const res = await api.get('/activity/logs');
            return res.data.data;
        }
    });

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!logs || logs.length === 0) {
        return <EmptyState icon={History} title="Nenhuma atividade" description="Os logs de auditoria aparecerão aqui conforme o sistema for utilizado." />;
    }

    return (
        <div className="space-y-3">
            {logs.map((log: any) => {
                const Icon = actionIcons[log.action] || History;
                return (
                    <div key={log.id} className="flex items-center gap-4 p-4 rounded-2xl border border-violet-50 hover:bg-violet-50/30 transition-all">
                        <div className="w-10 h-10 bg-white border border-violet-100 rounded-xl flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-violet-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-4">
                                <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-tight truncate">
                                    {log.user?.fullName || 'Sistema'}
                                </p>
                                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                                    {formatDate(log.createdAt)}
                                </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">
                                {(log.action || '').replace(/_/g, ' ')}: {log.entityType} #{log.entityId?.split('-')[0]}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
