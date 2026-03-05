'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';

interface LocattusLogoProps {
    className?: string;
    collapsed?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'normal' | 'white';
}

export const LocattusLogo = memo(({ className, size = 'md', variant = 'normal' }: LocattusLogoProps) => {
    // Locattus uses high-contract typography-based branding as per user request
    const sizeClasses = {
        sm: 'text-lg',
        md: 'text-2xl',
        lg: 'text-3xl'
    };

    return (
        <div className={cn('flex items-center gap-2 select-none group', className)}>
            <div className={cn(
                "w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center text-white font-extrabold shadow-lg group-hover:bg-violet-600 transition-colors duration-300",
                size === 'lg' && 'w-12 h-12 text-xl',
                size === 'sm' && 'w-8 h-8 text-sm'
            )}>
                L
            </div>
            <span className={cn(
                "font-extrabold tracking-tight text-zinc-900 uppercase italic",
                sizeClasses[size]
            )}>
                Locattus<span className="text-violet-600 not-italic">.</span>
            </span>
        </div>
    );
});

LocattusLogo.displayName = 'LocattusLogo';
