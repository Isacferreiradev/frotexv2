'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { PageTransition } from '@/components/shared/page-transition';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const user = useAuthStore((s) => s.user); // Used as a proxy for hydration check
    const router = useRouter();

    useEffect(() => {
        // If store is ready and not authenticated, redirect
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Handle Onboarding redirection
        // If user is authenticated, hasn't onboarded, and is NOT on the onboarding page
        if (isAuthenticated && user && !user.hasOnboarded && window.location.pathname !== '/onboarding') {
            router.push('/onboarding');
        }
    }, [isAuthenticated, user, router]);

    // Handle initial loading state where isAuthenticated is false but hydrate hasn't finished
    // We can check if a token exists in localStorage to decide if we wait
    if (!isAuthenticated) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-violet-600/20 border-t-violet-600 rounded-full animate-spin" />
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
                        Verificando Segurança...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6 relative">
                    <PageTransition>
                        {children}
                    </PageTransition>
                </main>
            </div>
        </div>
    );
}
