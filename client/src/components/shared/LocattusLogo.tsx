'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import Image from 'next/image';

interface LocattusLogoProps {
    className?: string;
    collapsed?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'normal' | 'white' | 'black' | 'symbol';
}

export const LocattusLogo = memo(({ className, size = 'md', variant = 'normal' }: LocattusLogoProps) => {
    const isWhite = variant === 'white';
    const isSymbol = variant === 'symbol';

    if (isSymbol) {
        return (
            <div className={cn('relative select-none', className)}>
                <Image
                    src="/symbol.png"
                    alt="Locattus Symbol"
                    width={size === 'xl' ? 64 : size === 'lg' ? 56 : size === 'sm' ? 36 : 44}
                    height={size === 'xl' ? 64 : size === 'lg' ? 56 : size === 'sm' ? 36 : 44}
                    className="object-contain"
                />
            </div>
        );
    }

    return (
        <div className={cn('flex items-center select-none', className)}>
            <Image
                src={isWhite ? "/logo-white.png" : "/logo-black.png"}
                alt="Locattus Logo"
                width={size === 'xl' ? 240 : size === 'lg' ? 200 : size === 'sm' ? 140 : 170}
                height={80}
                className="object-contain"
                priority
            />
        </div>
    );
});

LocattusLogo.displayName = 'LocattusLogo';
