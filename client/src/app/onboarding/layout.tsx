'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { PageTransition } from '@/components/shared/page-transition';
import { Loader2 } from 'lucide-react';

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
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

        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Se já completou, não deve estar aqui
        if (user && user.hasOnboarded === true) {
            router.push('/dashboard');
        }
    }, [hydrated, isAuthenticated, user, router]);

    if (!hydrated || !isAuthenticated) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-violet-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-600/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

            <main className="relative z-10">
                <PageTransition>
                    {children}
                </PageTransition>
            </main>
        </div>
    );
}
