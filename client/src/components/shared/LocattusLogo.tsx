'use client';

import { cn } from '@/lib/utils';
import { memo } from 'react';
import Image from 'next/image';

interface LocattusLogoProps {
    className?: string;
    collapsed?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'normal' | 'white' | 'black' | 'symbol';
}

export const LocattusLogo = memo(({ className, size = 'md', variant = 'normal' }: LocattusLogoProps) => {
    const isWhite = variant === 'white';
    const isSymbol = variant === 'symbol';

    if (isSymbol) {
        return (
            <div className={cn('relative select-none', className)}>
                <Image
                    src="/brand/symbol.png"
                    alt="Locattus Symbol"
                    width={size === 'lg' ? 48 : size === 'sm' ? 32 : 40}
                    height={size === 'lg' ? 48 : size === 'sm' ? 32 : 40}
                    className="object-contain"
                />
            </div>
        );
    }

    return (
        <div className={cn('flex items-center select-none', className)}>
            <Image
                src={isWhite ? "/brand/logo-white.png" : "/brand/logo-black.png"}
                alt="Locattus Logo"
                width={size === 'lg' ? 180 : size === 'sm' ? 120 : 150}
                height={60}
                className="object-contain"
                priority
            />
        </div>
    );
});

LocattusLogo.displayName = 'LocattusLogo';
