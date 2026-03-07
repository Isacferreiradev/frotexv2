"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { ChevronDown, Download, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Column<T> {
    header: string
    accessorKey: keyof T | string
    cell?: (item: T) => React.ReactNode
    className?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    isLoading?: boolean
    searchPlaceholder?: string
    onSearchChange?: (val: string) => void
    onRowClick?: (item: T) => void
    glass?: boolean
}

export function DataTable<T extends { id: string | number }>({
    data,
    columns,
    isLoading,
    searchPlaceholder = "Pesquisar...",
    onSearchChange,
    onRowClick,
    glass = true
}: DataTableProps<T>) {
    return (
        <div className={cn("flex flex-col gap-4", glass && "animate-in fade-in duration-700")}>
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl border border-border/40 p-3 sm:p-4 flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-border/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <Button variant="outline" size="sm" className="hidden sm:flex gap-2 rounded-xl">
                        <Download className="w-4 h-4" /> Exportar
                    </Button>
                    <Button variant="outline" size="sm" className="flex gap-2 rounded-xl">
                        <Filter className="w-4 h-4" /> Filtros
                    </Button>
                </div>
            </div>

            <div className={cn(
                "rounded-2xl border border-border/40 overflow-hidden shadow-soft transition-all",
                glass ? "glass-v2" : "bg-white"
            )}>
                {/* Desktop view (sm+) */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/20">
                                {columns.map((col, i) => (
                                    <th
                                        key={i}
                                        className={cn(
                                            "px-6 py-5 text-left text-[11px] font-bold text-muted-foreground uppercase tracking-[0.1em] transition-colors",
                                            col.className
                                        )}
                                    >
                                        {col.header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            <AnimatePresence mode="popLayout">
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={`skeleton-${i}`} className="animate-pulse">
                                            {columns.map((col, j) => (
                                                <td key={j} className={cn("px-6 py-4 font-jakarta", col.className)}>
                                                    <div className="h-4 bg-muted/40 rounded-md w-full" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : data.length === 0 ? (
                                    <tr>
                                        <td colSpan={columns.length} className="px-6 py-20 text-center text-muted-foreground font-medium">
                                            Nenhum registro encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item, index) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ delay: index * 0.03 }}
                                            onClick={() => onRowClick?.(item)}
                                            className={cn(
                                                "group hover:bg-primary/[0.02] transition-colors",
                                                onRowClick ? "cursor-pointer" : "cursor-default"
                                            )}
                                        >
                                            {columns.map((col, i) => (
                                                <td
                                                    key={i}
                                                    className={cn(
                                                        "px-6 py-4 text-sm text-foreground font-medium font-jakarta",
                                                        col.className
                                                    )}
                                                >
                                                    {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                                                </td>
                                            ))}
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Mobile view (xs) */}
                <div className="block sm:hidden divide-y divide-border/40">
                    <AnimatePresence mode="popLayout">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={`skeleton-m-${i}`} className="p-4 space-y-4 animate-pulse">
                                    <div className="h-4 bg-muted/40 rounded w-1/2" />
                                    <div className="h-3 bg-muted/20 rounded w-3/4" />
                                    <div className="h-3 bg-muted/20 rounded w-1/4" />
                                </div>
                            ))
                        ) : data.length === 0 ? (
                            <div className="p-10 text-center text-muted-foreground text-sm font-medium">
                                Nenhum registro encontrado
                            </div>
                        ) : (
                            data.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => onRowClick?.(item)}
                                    className="p-4 space-y-3 active:bg-muted/30 transition-colors"
                                >
                                    {columns.map((col, i) => (
                                        <div key={i} className="flex justify-between items-start gap-4">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
                                                {col.header}
                                            </span>
                                            <div className="text-right text-sm font-medium text-foreground max-w-[60%] truncate">
                                                {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
