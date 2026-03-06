'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { CommandMenu } from '../shared/CommandMenu';
import { NotificationCenter } from '../shared/NotificationCenter';

const pageTitles: Record<string, string> = {
    '/dashboard/automacao-cobranca': 'Automação de Cobrança',
    '/dashboard': 'Dashboard',
    '/ferramentas': 'Ferramentas',
    '/clientes': 'Clientes',
    '/locacoes': 'Locações',
    '/manutencao': 'Manutenção',
    '/configuracoes': 'Configurações',
};

export function Navbar() {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);

    const getTitle = () => {
        for (const [path, title] of Object.entries(pageTitles)) {
            if (pathname.startsWith(path)) return title;
        }
        return 'Overview';
    };

    return (
        <header className="sticky top-0 z-40 px-8 py-4 flex items-center justify-between glass-v2 shadow-soft">
            <div className="flex items-center gap-8">
                <div>
                    <h1 className="text-base font-bold text-foreground tracking-tight">{getTitle()}</h1>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                </div>

                <div className="hidden lg:block h-6 w-[1px] bg-border" />

                <div className="hidden md:block">
                    <CommandMenu />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <NotificationCenter />

                <div className="h-4 w-[1px] bg-border mx-1" />

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[13px] font-semibold text-foreground leading-none">{user?.fullName}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1 opacity-70">
                            {user?.role === 'owner' ? 'Proprietário' : 'Operador'}
                        </p>
                    </div>
                    <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center border border-border overflow-hidden shadow-soft transition-transform hover:scale-105 duration-300">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary rounded-full flex items-center justify-center m-0.5">
                                <span className="text-white text-[10px] font-extrabold leading-none">
                                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
