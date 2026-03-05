'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Check, ShieldAlert, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface CustomerSearchProps {
    onSelect: (customer: any) => void;
    selectedId?: string;
}

export function CustomerSearch({ onSelect, selectedId }: CustomerSearchProps) {
    const [search, setSearch] = useState('');

    const { data: customers, isLoading } = useQuery({
        queryKey: ['customers'],
        queryFn: async () => {
            const res = await api.get('/customers');
            return res.data.data;
        },
    });

    const filtered = (customers || []).filter((c: any) =>
        !search || c.fullName.toLowerCase().includes(search.toLowerCase()) ||
        c.documentNumber.includes(search)
    ).slice(0, 50);

    return (
        <div className="space-y-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                    className="pl-11 h-12 rounded-button border-border focus:ring-primary/20 bg-white shadow-soft group-focus-within:shadow-premium transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="max-h-[350px] overflow-y-auto border border-border rounded-premium divide-y divide-border bg-white shadow-soft">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/30" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Localizando Responsáveis...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <p className="text-sm font-medium">Nenhum cliente encontrado.</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-50">Tente buscar por documento</p>
                    </div>
                ) : (
                    filtered.map((customer: any) => (
                        <button
                            key={customer.id}
                            disabled={customer.isBlocked}
                            onClick={() => onSelect(customer)}
                            className={cn(
                                "w-full px-6 py-4 flex items-center justify-between transition-all text-left",
                                customer.isBlocked ? "opacity-40 cursor-not-allowed bg-muted/30" : "hover:bg-muted/50",
                                selectedId === customer.id && "bg-primary/5 border-l-4 border-l-primary"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    selectedId === customer.id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                )}>
                                    {customer.isBlocked ? <ShieldAlert className="w-5 h-5 text-red-500" /> : <User className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-foreground">{customer.fullName}</p>
                                        {customer.isBlocked && <span className="text-[8px] font-extrabold bg-red-500 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">Bloqueado</span>}
                                    </div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                                        {customer.documentNumber} · {customer.phoneNumber}
                                    </p>
                                </div>
                            </div>
                            {selectedId === customer.id && (
                                <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shadow-premium">
                                    <Check className="w-3.5 h-3.5" />
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
