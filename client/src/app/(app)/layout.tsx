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
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl animate-bounce">
                        L
                    </div>
                    <div className="space-y-2 text-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">
                            Locatus Security Protocols
                        </p>
                        <div className="flex justify-center gap-1">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                            ))}
                        </div>
                    </div>
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
