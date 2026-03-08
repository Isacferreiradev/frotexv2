'use client';

import { useEffect, useRef } from 'react';
import { driver as createDriver } from 'driver.js';
import 'driver.js/dist/driver.css';
import '@/styles/product-tour.css';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

// ─── Tour Step Definitions ───────────────────────────────────────────────────
// To add a new step in the future, just push to this array.
// Each `element` targets the unique `id` attribute on the Sidebar Link.
// ---------------------------------------------------------------------------

const TOUR_STEPS = [
    {
        element: '#tour-nav-dashboard',
        popover: {
            title: '📊 Dashboard',
            description:
                'Acompanhe em tempo real as principais métricas da sua locadora: faturamento, locações ativas, equipamentos disponíveis e muito mais.',
            side: 'right' as const,
            align: 'center' as const,
        },
    },
    {
        element: '#tour-nav-ferramentas',
        popover: {
            title: '🔧 Equipamentos',
            description:
                'Cadastre e gerencie todo o inventário da sua locadora. Defina categorias, valores de diária e controle a disponibilidade de cada equipamento.',
            side: 'right' as const,
            align: 'center' as const,
        },
    },
    {
        element: '#tour-nav-clientes',
        popover: {
            title: '👥 Clientes',
            description:
                'Armazene os dados dos seus clientes e consulte o histórico completo de locações, pagamentos e muito mais.',
            side: 'right' as const,
            align: 'center' as const,
        },
    },
    {
        element: '#tour-nav-locacoes',
        popover: {
            title: '📋 Locações',
            description:
                'Crie e acompanhe contratos de aluguel do início ao fim. Registre retiradas, devoluções e controle os prazos de cada locação.',
            side: 'right' as const,
            align: 'center' as const,
        },
    },
    {
        element: '#tour-nav-financeiro',
        popover: {
            title: '💰 Financeiro',
            description:
                'Visualize receitas consolidadas, valores em aberto e análises de faturamento para manter o caixa da sua locadora sempre sob controle.',
            side: 'right' as const,
            align: 'center' as const,
        },
    },
    {
        element: '#tour-nav-configuracoes',
        popover: {
            title: '⚙️ Configurações',
            description:
                'Ajuste os dados da empresa, personalize o sistema e configure as preferências de acordo com o seu negócio.',
            side: 'right' as const,
            align: 'center' as const,
        },
    },
];

// ---------------------------------------------------------------------------

export function GuidedTour() {
    const user = useAuthStore((s) => s.user);
    const updateUser = useAuthStore((s) => s.updateUser);
    const driverRef = useRef<ReturnType<typeof createDriver> | null>(null);
    const hasStarted = useRef(false);

    // Fetch current tour state from the server (busted cache — always fresh)
    const { data: onboardingStatus } = useQuery({
        queryKey: ['onboarding-status'],
        queryFn: async () => (await api.get('/onboarding/status')).data.data,
        staleTime: 0,
        gcTime: 0,
        // Only run if user is logged in and has onboarded
        enabled: !!user && user.hasOnboarded === true,
    });

    const markTourSeen = async () => {
        try {
            await api.post('/onboarding/tour-complete');
        } catch { /* best-effort — don't block the UI */ }
        updateUser({ hasSeenTour: true });
    };

    useEffect(() => {
        // Guard: only run once, only after user has fully onboarded and NOT seen the tour
        const shouldStart =
            !!user?.hasOnboarded &&
            onboardingStatus?.hasSeenTour === false &&
            !user?.hasSeenTour &&
            !hasStarted.current;

        if (!shouldStart) return;

        hasStarted.current = true;

        // Delay start to allow the sidebar elements to be fully rendered in the DOM
        const timer = setTimeout(() => {
            const driverInstance = createDriver({
                animate: true,
                overlayOpacity: 0.55,
                smoothScroll: true,
                allowClose: true,
                showProgress: true,
                progressText: 'Passo {{current}} de {{total}}',
                nextBtnText: 'Próximo →',
                prevBtnText: '← Voltar',
                doneBtnText: 'Concluir tour ✓',
                popoverClass: 'locattus-tour-popover',

                onDestroyed: () => {
                    markTourSeen();
                },

                steps: TOUR_STEPS,
            });

            driverRef.current = driverInstance;
            driverInstance.drive();
        }, 1200);

        return () => {
            clearTimeout(timer);
            driverRef.current?.destroy();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.hasOnboarded, user?.hasSeenTour, onboardingStatus?.hasSeenTour]);

    return null;
}
