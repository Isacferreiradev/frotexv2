'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 30, // 30 seconds
            retry: 1,
        },
    },
});


export function Providers({ children }: { children: React.ReactNode }) {
    const hydrate = useAuthStore((s) => s.hydrate);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        hydrate();
        setMounted(true);
    }, [hydrate]);

    if (!mounted) return null;

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
