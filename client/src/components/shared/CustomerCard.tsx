'use client';

import { User, Phone, Mail, FileText, MoreVertical, MessageSquare, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPulse } from './StatusPulse';
import { useRouter } from 'next/navigation';

interface CustomerCardProps {
    customer: any;
    onEdit: (customer: any) => void;
    onToggleBlock: (id: string, isBlocked: boolean) => void;
}

export function CustomerCard({ customer, onEdit, onToggleBlock }: CustomerCardProps) {
    const router = useRouter();
    const initials = customer.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <div
            onClick={() => router.push(`/clientes/${customer.id}`)}
            className={cn(
                "group bg-white rounded-[28px] border border-violet-50 premium-shadow hover-scale overflow-hidden flex flex-col h-full cursor-pointer",
                customer.isBlocked && "border-red-100 opacity-90"
            )}
        >
            {/* Header / Avatar Section */}
            <div className="relative h-24 bg-slate-50 flex items-center justify-center border-b border-violet-50">
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full border border-violet-100 flex items-center gap-2 shadow-sm">
                        <StatusPulse status={customer.isBlocked ? 'blocked' : 'active'} />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">
                            {customer.isBlocked ? 'Bloqueado' : 'Ativo'}
                        </span>
                    </div>
                </div>

                <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold transition-all duration-500 group-hover:scale-110",
                    customer.isBlocked
                        ? "bg-red-50 text-red-500"
                        : "bg-violet-100 text-violet-600 group-hover:bg-violet-600 group-hover:text-white"
                )}>
                    {initials}
                </div>

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(customer);
                    }}
                    className="absolute top-4 right-4 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl border border-violet-100 flex items-center justify-center text-zinc-400 hover:text-violet-600 transition-all opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 flex-1 flex flex-col">
                <div className="flex-1">
                    <h4 className="font-bold text-zinc-900 text-lg tracking-tight leading-tight group-hover:text-violet-600 transition-colors line-clamp-1">
                        {customer.fullName}
                    </h4>
                    <p className="text-[10px] font-semibold text-zinc-400 mt-1 uppercase tracking-tight">
                        {customer.documentType}: {customer.documentNumber}
                    </p>

                    {customer.tags && customer.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {customer.tags.map((tag: string) => (
                                <span key={tag} className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full text-[8px] font-bold uppercase border border-violet-100/50">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}


                    <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Phone className="w-3 h-3 text-violet-400" />
                            <span className="text-[11px] font-medium">{customer.phoneNumber}</span>
                        </div>
                        {customer.email && (
                            <div className="flex items-center gap-2 text-zinc-500">
                                <Mail className="w-3 h-3 text-violet-400" />
                                <span className="text-[11px] font-medium truncate">{customer.email}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 pt-6 border-t border-violet-50 flex items-center justify-between gap-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            window.open(`https://wa.me/${(customer.phoneNumber || '').replace(/\D/g, '')}`, '_blank');
                        }}
                        className="flex-1 bg-emerald-50 text-emerald-600 rounded-xl py-2.5 flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                    >
                        <MessageSquare className="w-3 h-3" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">WhatsApp</span>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleBlock(customer.id, !customer.isBlocked);
                        }}
                        className={cn(
                            "px-3 py-2.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all",
                            customer.isBlocked
                                ? "bg-white border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                                : "bg-white border-red-100 text-red-500 hover:bg-red-50"
                        )}
                    >
                        {customer.isBlocked ? 'Liberar' : 'Bloquear'}
                    </button>
                </div>
            </div>
        </div>
    );
}
