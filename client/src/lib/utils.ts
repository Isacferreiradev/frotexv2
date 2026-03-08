import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number | string | null | undefined) => {
  const amount = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount || 0);
};

export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date: Date | string) => {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const STATUS_LABELS: Record<string, string> = {
  // Tools
  available: 'Disponível',
  rented: 'Alugado',
  maintenance: 'Manutenção',
  unavailable: 'Indisponível',
  lost: 'Perdido',
  sold: 'Vendido',
  // Rentals
  active: 'Ativa',
  returned: 'Devolvida',
  cancelled: 'Cancelada',
  pending: 'Pendente',
};

export const STATUS_COLORS: Record<string, string> = {
  // Tools
  available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  rented: 'bg-violet-50 text-violet-600 border-violet-100',
  maintenance: 'bg-amber-50 text-amber-600 border-amber-100',
  unavailable: 'bg-zinc-50 text-zinc-600 border-zinc-100',
  lost: 'bg-red-50 text-red-600 border-red-100',
  sold: 'bg-zinc-50 text-zinc-500 border-zinc-100',
  // Rentals
  active: 'bg-violet-50 text-violet-600 border-violet-100',
  returned: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  cancelled: 'bg-red-50 text-red-600 border-red-100',
};

export async function downloadFile(url: string, filename: string) {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Falha no download');

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
