import { create } from 'zustand';

interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'owner' | 'employee';
    tenantId: string;
    avatarUrl?: string | null;
    systemRole: 'user' | 'admin';
    hasOnboarded?: boolean;
    hasSeenTour?: boolean;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    setAuth: (user: User) => void;
    updateUser: (user: Partial<User>) => void;
    logout: () => void;
    hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isAuthenticated: false,

    setAuth: (user) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user, isAuthenticated: true });
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
            localStorage.removeItem('user');

            // Fire API call to clear HttpOnly cookies on the backend securely
            try {
                const api = require('@/lib/api').default;
                api.post('/auth/logout').catch(console.error);
            } catch (e) {
                console.error('Failed to call logout API', e);
            }

            // CRITICAL FIX: Flush React Query cache to prevent data bleeding between accounts
            try {
                const { queryClient } = require('@/components/providers');
                queryClient.clear();
            } catch (e) {
                console.error('Failed to clear query cache', e);
            }
        }
        set({ user: null, isAuthenticated: false });
    },

    hydrate: () => {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('user');

            // HttpOnly cookies handle pure auth validity. Re-hydrate UI user data blindly
            // since actual restricted API calls will 401 and redirect them if the cookie expired.
            if (userStr) {
                try {
                    const user = JSON.parse(userStr) as User;
                    set({ user, isAuthenticated: true });
                } catch {
                    localStorage.removeItem('user');
                }
            } else {
                // Clear state if storage is empty
                set({ user: null, isAuthenticated: false });
            }
        }
    },
}));
