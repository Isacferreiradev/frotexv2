"use client"

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

const COLORS = ['#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#DDD6FE']

interface ROIChartProps {
    data: any[]
    loading?: boolean
}

export function ROIChart({ data, loading }: ROIChartProps) {
    if (loading) return <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-2xl" />

    const hasData = data && data.length > 0;

    return (
        <Card glass className="col-span-1 xl:col-span-1 border-none">
            <CardHeader>
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                    ROI por Categoria
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    backdropFilter: 'blur(12px)',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(229, 231, 235, 0.4)',
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.05)'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest">Sem dados no período</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
