'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Check, Wrench } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Tool } from '@/types';

interface ToolSearchProps {
    onSelect: (tool: Tool) => void;
    selectedId?: string;
}

export function ToolSearch({ onSelect, selectedId }: ToolSearchProps) {
    const [search, setSearch] = useState('');

    const { data: tools, isLoading } = useQuery({
        queryKey: ['tools', 'available'],
        queryFn: async () => {
            const res = await api.get('/tools?status=available');
            return res.data.data;
        },
    });

    const filtered = (tools || []).filter((t: Tool) =>
        !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.serialNumber?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Buscar ferramenta disponível..."
                    className="pl-11 h-12 rounded-button border-border focus:ring-primary/20 bg-white shadow-soft group-focus-within:shadow-premium transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="max-h-[350px] overflow-y-auto border border-border rounded-premium divide-y divide-border bg-white shadow-soft">
                {isLoading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary/30" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Sincronizando Ativos...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <p className="text-sm font-medium">Nenhum equipamento livre.</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-50">Tente buscar por outro termo</p>
                    </div>
                ) : (
                    filtered.map((tool: Tool) => (
                        <button
                            key={tool.id}
                            onClick={() => onSelect(tool)}
                            className={cn(
                                "w-full px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-all text-left group/item",
                                selectedId === tool.id && "bg-primary/5 border-l-4 border-l-primary"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-button flex items-center justify-center transition-all",
                                    selectedId === tool.id ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover/item:bg-primary/10 group-hover/item:text-primary"
                                )}>
                                    <Wrench className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-foreground group-hover/item:text-primary transition-colors">{tool.name}</p>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-tight">
                                        {tool.brand} · {formatCurrency(tool.dailyRate)}
                                    </p>
                                </div>
                            </div>
                            {selectedId === tool.id && (
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
