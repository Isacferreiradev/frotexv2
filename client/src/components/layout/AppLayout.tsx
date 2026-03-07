'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { OnboardingTour } from '../shared/OnboardingTour';

export function AppLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router]);

    if (!isAuthenticated) return null;

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Backdrop for mobile drawer */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-zinc-950/20 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                <Navbar onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-slate-50/50">
                    <div className="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 transition-all duration-300">
                        {children}
                    </div>
                </main>
            </div>
            <OnboardingTour />
        </div>
    );
}
