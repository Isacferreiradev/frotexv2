import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    eachDayOfInterval, isSameDay, isWithinInterval, startOfDay, endOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailabilityCalendarProps {
    toolId: string;
}

export function AvailabilityCalendar({ toolId }: AvailabilityCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const { data: rentals, isLoading } = useQuery({
        queryKey: ['tool-availability', toolId],
        queryFn: async () => {
            const res = await api.get(`/rentals/availability/${toolId}`);
            return res.data.data;
        },
    });

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    });

    const getDayStatus = (day: Date) => {
        if (!rentals) return null;

        const dayRentals = rentals.filter((r: any) => {
            const start = startOfDay(new Date(r.startDate));
            const end = startOfDay(new Date(r.endDateActual || r.endDateExpected));
            return isWithinInterval(startOfDay(day), { start, end });
        });

        if (dayRentals.length > 0) {
            const isMaintenance = dayRentals.some((r: any) => r.status === 'maintenance');
            return isMaintenance ? 'maintenance' : 'rented';
        }
        return 'available';
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    return (
        <div className="bg-white rounded-[28px] border border-violet-50 premium-shadow overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-violet-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CalendarIcon className="w-5 h-5 text-violet-600" />
                    <h4 className="font-bold text-zinc-900 text-sm uppercase tracking-widest">
                        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                    </h4>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-violet-100">
                        <ChevronLeft className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl transition-colors border border-transparent hover:border-violet-100">
                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                    </button>
                </div>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-violet-200 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                                <div key={d} className="text-center text-[9px] font-extrabold text-zinc-400 uppercase tracking-tight py-2">
                                    {d}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {/* Empty days before start of month */}
                            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}

                            {days.map((day, i) => {
                                const status = getDayStatus(day);
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            "aspect-square rounded-xl flex items-center justify-center text-[11px] font-bold transition-all relative group cursor-default",
                                            status === 'available' ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100" :
                                                status === 'maintenance' ? "bg-amber-50 text-amber-600" :
                                                    "bg-red-50 text-red-600"
                                        )}
                                    >
                                        {format(day, 'd')}
                                        {status !== 'available' && (
                                            <div className={cn(
                                                "absolute bottom-1 w-1 h-1 rounded-full",
                                                status === 'maintenance' ? "bg-amber-400" : "bg-red-400"
                                            )} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-8 pt-6 border-t border-violet-50 grid grid-cols-3 gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Livre</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Alugado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Revisão</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="px-6 py-4 bg-violet-50/30 flex items-center gap-3">
                <Info className="w-3.5 h-3.5 text-violet-400" />
                <p className="text-[10px] text-violet-500 font-medium leading-relaxed italic">
                    Períodos bloqueados impedem novas locações nestas datas.
                </p>
            </div>
        </div>
    );
}
