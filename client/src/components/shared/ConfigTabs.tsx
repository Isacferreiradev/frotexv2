'use client';

import { cn } from '@/lib/utils';
import { User, Building2, Shield, CreditCard } from 'lucide-react';

interface ConfigTabsProps {
    activeTab: string;
    onChange: (tab: string) => void;
}

const tabs = [
    { id: 'perfil', label: 'Meu Perfil', icon: User },
    { id: 'empresa', label: 'Minha Empresa', icon: Building2 },
    { id: 'seguranca', label: 'Segurança', icon: Shield },
    { id: 'assinatura', label: 'Assinatura', icon: CreditCard },
];

export function ConfigTabs({ activeTab, onChange }: ConfigTabsProps) {
    return (
        <div className="flex items-center gap-1 bg-zinc-100/50 p-1 rounded-2xl w-fit">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                            isActive
                                ? "bg-white text-violet-600 shadow-sm"
                                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50"
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
