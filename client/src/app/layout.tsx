import type { Metadata } from 'next';
import './globals.css';
import { Outfit, Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/sonner';
import { GuidedTour } from '@/components/shared/GuidedTour';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AlugaFácil Pro — Gestão de Locadoras',
  description: 'Sistema de gestão para locadoras de ferramentas e equipamentos. Controle de inventário, locações, clientes e manutenção.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased font-inter bg-white text-zinc-900 selection:bg-violet-100 selection:text-violet-900">
        <Providers>
          {children}
          <Toaster position="top-right" expand={true} richColors />
        </Providers>
      </body>
    </html>
  );
}
