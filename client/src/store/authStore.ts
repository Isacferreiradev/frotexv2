import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'owner' | 'employee';
    tenantId: string;
    avatarUrl?: string | null;
    hasOnboarded?: boolean;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,

    setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));
            // Sync with cookie for middleware protection
            document.cookie = `access_token=${accessToken}; path=/; max-age=604800; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        }
        set({ user, accessToken, isAuthenticated: true });
    },

    updateUser: (partialUser) => {
        set((state) => {
            if (!state.user) return state;
            const updatedUser = { ...state.user, ...partialUser };
            if (typeof window !== 'undefined') {
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            return { user: updatedUser };
        });
    },

    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            // Remove auth cookie
            document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';

            // CRITICAL FIX: Flush React Query cache to prevent data bleeding between accounts
            try {
                const { queryClient } = require('@/components/providers');
                queryClient.clear();
            } catch (e) {
                console.error('Failed to clear query cache', e);
            }
        }
        set({ user: null, accessToken: null, isAuthenticated: false });
    },

    hydrate: () => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('access_token');
            const userStr = localStorage.getItem('user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr) as User;
                    // Ensure cookie is in sync during hydration
                    if (!document.cookie.includes('access_token=')) {
                        document.cookie = `access_token=${token}; path=/; max-age=604800; SameSite=Lax`;
                    }
                    set({ user, accessToken: token, isAuthenticated: true });
                } catch {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('user');
                    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
                }
            } else {
                // Clear state if storage is empty
                set({ user: null, accessToken: null, isAuthenticated: false });
            }
        }
    },
}));
