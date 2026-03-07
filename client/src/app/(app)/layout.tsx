'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { PageTransition } from '@/components/shared/page-transition';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
    const hydrate = useAuthStore((s) => s.hydrate);
    const user = useAuthStore((s) => s.user);
    const router = useRouter();
    const [hydrated, setHydrated] = useState(false);

    // Run hydrate exactly once on mount to restore auth from localStorage
    useEffect(() => {
        hydrate();
        setHydrated(true);
    }, [hydrate]);

    // After hydration, handle redirects
    useEffect(() => {
        if (!hydrated) return;

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Only redirect to onboarding if hasOnboarded is explicitly false (not undefined)
        if (user && user.hasOnboarded === false && window.location.pathname !== '/onboarding') {
            router.push('/onboarding');
        }
    }, [hydrated, isAuthenticated, user, router]);

    // Show spinner only during initial hydration to avoid flash
    if (!hydrated || !isAuthenticated) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
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
