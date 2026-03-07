'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search, Menu } from 'lucide-react';
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

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();
    const user = useAuthStore((s) => s.user);

    const getTitle = () => {
        for (const [path, title] of Object.entries(pageTitles)) {
            if (pathname.startsWith(path)) return title;
        }
        return 'Overview';
    };

    return (
        <header className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex items-center justify-between glass-v2 shadow-soft border-b border-white/10">
            <div className="flex items-center gap-3 sm:gap-8">
                {/* Mobile Menu Trigger */}
                <button
                    onClick={onMenuClick}
                    className="p-2 sm:p-2.5 -ml-1 sm:-ml-2 text-zinc-600 hover:text-primary lg:hidden rounded-xl bg-muted/40 transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <div className="min-w-0">
                    <h1 className="text-sm sm:text-base font-bold text-foreground truncate">{getTitle()}</h1>
                    <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 opacity-60 truncate">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    </p>
                </div>

                <div className="hidden lg:block h-6 w-[1px] bg-border/60" />

                <div className="hidden md:block">
                    <CommandMenu />
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-6">
                <div className="hidden xs:block">
                    <NotificationCenter />
                </div>

                <div className="h-4 w-[1px] bg-border/60 mx-1 hidden xs:block" />

                <div className="flex items-center gap-2 sm:gap-3 pl-1 sm:pl-2">
                    <div className="text-right hidden sm:block">
                        <p className="text-[13px] font-semibold text-foreground leading-none">{user?.fullName}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1 opacity-70">
                            {user?.role === 'owner' ? 'Proprietário' : 'Operador'}
                        </p>
                    </div>
                    <div className="w-8 h-8 sm:w-9 sm:h-9 bg-muted rounded-full flex items-center justify-center border border-border overflow-hidden shadow-soft transition-transform hover:scale-105 duration-300">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-primary rounded-full flex items-center justify-center m-0.5">
                                <span className="text-white text-[10px] sm:text-[11px] font-extrabold leading-none">
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
