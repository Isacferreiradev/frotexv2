"use client"

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"

interface RevenueChartProps {
    data: any[]
    loading?: boolean
}

export function RevenueChart({ data, loading }: RevenueChartProps) {
    if (loading) return <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-2xl" />

    return (
        <Card glass className="col-span-1 md:col-span-2 xl:col-span-3">
            <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    Fluxo de Faturamento
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">Últimos 30 dias</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#6D28D9" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF' }}
                            tickFormatter={(val) => `R$ ${val}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(229, 231, 235, 0.4)',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
                            }}
                            formatter={(val: number) => [formatCurrency(val), "Faturamento"]}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#6D28D9"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
