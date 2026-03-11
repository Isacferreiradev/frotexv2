'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminNavbar } from '@/components/admin/AdminNavbar';
import { PageTransition } from '@/components/shared/page-transition';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const hydrate = useAuthStore((s) => s.hydrate);
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        hydrate();
        setHydrated(true);
    }, [hydrate]);

    useEffect(() => {
        if (!hydrated) return;

        // 1. Must be logged in
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // 2. Must be a System Admin
        if (user && user.systemRole !== 'admin') {
            console.error('[ADMIN-GUARD] Access denied: Not a System Admin');
            router.push('/dashboard'); // Kick back to regular dashboard
        }
    }, [hydrated, isAuthenticated, user, router]);

    // Show loading state while checking permissions
    if (!hydrated || !isAuthenticated || (user && user.systemRole !== 'admin')) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-blue-400 font-bold tracking-widest text-xs uppercase animate-pulse">Sincronizando Central de Comando</p>
                        <p className="text-slate-500 text-[10px] font-medium tracking-tight">Verificando credenciais root...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminNavbar />
                <main className="flex-1 overflow-y-auto relative no-scrollbar">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
