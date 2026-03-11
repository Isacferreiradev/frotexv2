'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    TrendingUp,
    ShieldAlert,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Search,
    LifeBuoy
} from 'lucide-react';

import { LocattusLogo } from '@/components/shared/LocattusLogo';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const ADMIN_NAV_ITEMS = [
    { href: '/admin/dashboard', label: 'Dashboard Master', icon: LayoutDashboard },
    { href: '/admin/tenants', label: 'Empresas / Tenants', icon: Building2 },
    { href: '/admin/users', label: 'Usuários Master', icon: Users },
    { href: '/admin/subscriptions', label: 'Assinaturas', icon: CreditCard },
    { href: '/admin/revenue', label: 'Receita & Faturamento', icon: TrendingUp },
    { href: '/admin/activation', label: 'Funil de Ativação', icon: BarChart3 },
    { href: '/admin/security', label: 'Segurança & Logs', icon: ShieldAlert },
    { href: '/admin/settings', label: 'Configurações Master', icon: Settings },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <aside
            className={cn(
                'relative flex flex-col h-screen bg-slate-900 text-slate-300 transition-all duration-500 ease-in-out shrink-0 select-none shadow-2xl z-50 border-r border-slate-800',
                collapsed ? 'w-20' : 'w-72'
            )}
        >
            {/* Admin Badge/Header */}
            <div className={cn("px-5 py-6 mb-4 flex items-center justify-between", collapsed && "justify-center px-2")}>
                <Link href="/admin/dashboard" className="transition-all duration-300">
                    <LocattusLogo variant={collapsed ? "symbol" : "normal"} size={collapsed ? "sm" : "lg"} />
                </Link>
            </div>

            {!collapsed && (
                <div className="px-6 mb-6">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20 w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold tracking-widest uppercase">Central de Comando</span>
                    </div>
                </div>
            )}

            {/* Admin Nav */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
                {ADMIN_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative',
                                isActive
                                    ? 'bg-slate-800 text-white border border-slate-700/50 shadow-lg'
                                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200',
                                collapsed && 'justify-center px-2'
                            )}
                        >
                            <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300", isActive ? "text-blue-400 scale-110" : "text-slate-500 group-hover:text-slate-300")} />
                            {!collapsed && (
                                <span className={cn(
                                    "text-sm tracking-tight",
                                    isActive ? "font-semibold" : "font-medium"
                                )}>{item.label}</span>
                            )}
                            {isActive && (
                                <div className="absolute left-0 w-1 h-4 bg-blue-500 rounded-r-full" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Profile Section */}
            <div className="p-4 mt-auto border-t border-slate-800 space-y-2">
                {!collapsed && (
                    <div className="px-3 py-4 bg-slate-800/50 rounded-2xl border border-slate-700/30">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/30">
                                {user?.fullName?.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-white text-xs font-bold truncate tracking-tight">{user?.fullName}</p>
                                <p className="text-slate-500 text-[10px] truncate leading-none mt-1">Super Administrador</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={cn(
                        'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group',
                        collapsed && 'justify-center px-2'
                    )}
                >
                    <LogOut className="w-4 h-4 shrink-0 transition-colors" />
                    {!collapsed && <span className="text-xs font-bold tracking-wider uppercase">Encerrar Sessão</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-24 w-6 h-6 bg-slate-900 border border-slate-700 shadow-xl rounded-full hidden lg:flex items-center justify-center text-slate-500 hover:text-white transition-all z-20"
            >
                {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
        </aside>
    );
}
