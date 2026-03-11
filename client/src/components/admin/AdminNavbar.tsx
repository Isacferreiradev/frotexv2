'use client';

import {
    Bell,
    Search,
    Menu,
    ShieldCheck,
    Terminal,
    ArrowUpRight,
    Command
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export function AdminNavbar({ onMenuClick }: { onMenuClick?: () => void }) {
    const user = useAuthStore((s) => s.user);

    return (
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-slate-100 rounded-lg lg:hidden"
                >
                    <Menu className="w-5 h-5 text-slate-600" />
                </button>

                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 group transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/30">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Busca global administrativa (Empresas, IDs, CPFs...)"
                        className="bg-transparent border-none text-xs focus:ring-0 w-64 lg:w-96 text-slate-700 placeholder:text-slate-400 placeholder:font-medium"
                    />
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-400 font-bold shadow-sm">
                        <Command className="w-2.5 h-2.5" />
                        <span>K</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
                {/* Environment Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-[11px] font-bold">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>PROD MASTER</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-1" />
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

                <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative group">
                    <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
                </button>

                <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200">
                    <div className="hidden lg:block text-right">
                        <p className="text-xs font-bold text-slate-800 leading-tight">{user?.fullName}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">Root Access</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
