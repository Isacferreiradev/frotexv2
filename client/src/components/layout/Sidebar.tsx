'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Wrench,
    Users,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    PenToolIcon,
    DollarSign,
    Calculator,
    Brain,
    BarChart3
} from 'lucide-react';

import { LocattusLogo } from '@/components/shared/LocattusLogo';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const NAV_ITEMS = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ferramentas', label: 'Ferramentas', icon: Wrench },
    { href: '/clientes', label: 'Clientes', icon: Users },
    { href: '/locacoes', label: 'Locações', icon: FileText },
    { href: '/orcamentos', label: 'Orçamentos', icon: Calculator },
    { href: '/inteligencia', label: 'Inteligência', icon: Brain },
    { href: '/manutencao', label: 'Manutenção', icon: PenToolIcon },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    { href: '/financeiro', label: 'Financeiro', icon: DollarSign },
    { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [collapsed, setCollapsed] = useState(false);

    // Notebook optimization: Auto-collapse on smaller desktop screens
    useState(() => {
        if (typeof window !== 'undefined') {
            const isNotebook = window.innerWidth >= 1024 && window.innerWidth <= 1366;
            if (isNotebook) setCollapsed(true);
        }
    });

    // Use granular selectors to prevent sidebar from re-rendering on every auth change
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const prefetchData = useCallback((href: string) => {
        if (href === '/dashboard') {
            queryClient.prefetchQuery({
                queryKey: ['dashboard-stats'],
                queryFn: async () => (await api.get('/rentals/dashboard-stats')).data.data,
            });
            queryClient.prefetchQuery({
                queryKey: ['rentals', 'active'],
                queryFn: async () => (await api.get('/rentals?status=active')).data.data,
            });
        } else if (href === '/ferramentas') {
            queryClient.prefetchQuery({
                queryKey: ['tools', ''],
                queryFn: async () => (await api.get('/tools')).data.data,
            });
        } else if (href === '/clientes') {
            queryClient.prefetchQuery({
                queryKey: ['customers'],
                queryFn: async () => (await api.get('/customers')).data.data,
            });
        } else if (href === '/locacoes') {
            queryClient.prefetchQuery({
                queryKey: ['rentals', ''],
                queryFn: async () => (await api.get('/rentals')).data.data,
            });
        } else if (href === '/manutencao') {
            queryClient.prefetchQuery({
                queryKey: ['maintenance-logs'],
                queryFn: async () => (await api.get('/maintenance/logs')).data.data,
            });
        }
    }, [queryClient]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside
            className={cn(
                'fixed inset-y-0 left-0 lg:relative flex flex-col h-screen bg-white transition-all duration-500 ease-in-out shrink-0 select-none shadow-premium z-50',
                collapsed ? 'w-20' : 'w-64',
                !mobileOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0 translate-y-0 shadow-2xl'
            )}
        >
            {/* Logo */}
            <div className={cn("px-5 py-6 mb-4 sm:mb-8 flex items-center justify-between lg:justify-start", collapsed && "lg:justify-center px-2")}>
                <Link href="/dashboard" className="transition-all duration-300">
                    <LocattusLogo variant={collapsed ? "symbol" : "normal"} size={collapsed ? "sm" : "lg"} />
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto no-scrollbar">
                {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            id={`tour-nav-${item.href.replace('/', '')}`}
                            href={item.href}
                            prefetch={true}
                            onMouseEnter={() => prefetchData(item.href)}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                                isActive
                                    ? 'bg-secondary/40 text-foreground'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                collapsed && 'justify-center px-2'
                            )}
                        >
                            <Icon className={cn("w-4 h-4 shrink-0 transition-transform duration-300", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {!collapsed && (
                                <span className={cn(
                                    "text-[13px] tracking-tight leading-none",
                                    isActive ? "font-semibold" : "font-medium"
                                )}>{item.label}</span>
                            )}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-3.5 bg-primary rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-4 pb-6 pt-4 space-y-2">
                {!collapsed && (
                    <div className="px-3 py-3 bg-muted/30 rounded-xl border border-border/40 group cursor-default transition-all hover:bg-muted/50">
                        <p className="text-foreground text-[11px] font-semibold truncate transition-colors group-hover:text-primary">{user?.fullName}</p>
                        <p className="text-muted-foreground text-[10px] truncate tracking-tight">{user?.email}</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-muted-foreground hover:bg-red-50/50 hover:text-red-500 transition-all duration-200 group',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <LogOut className="w-4 h-4 shrink-0 transition-colors" />
                    {!collapsed && <span className="text-[10px] font-semibold tracking-[0.15em] uppercase opacity-70">Sair</span>}
                </button>
            </div>

            {/* Collapse toggle (Desktop only) */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-24 w-6 h-6 bg-white border border-violet-100 shadow-sm rounded-full hidden lg:flex items-center justify-center text-zinc-400 hover:text-violet-600 transition-all z-20"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
        </aside>
    );
}
