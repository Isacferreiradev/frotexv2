'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = 'danger',
    isLoading = false,
}: ConfirmModalProps) {
    const isDanger = variant === 'danger';

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none bg-white/80 backdrop-blur-2xl shadow-2xl rounded-[2rem]">
                <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                            isDanger ? "bg-red-50 text-red-600 shadow-red-100" : "bg-amber-50 text-amber-600 shadow-amber-100"
                        )}>
                            {isDanger ? <Trash2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-zinc-900 tracking-tight">
                                {title}
                            </DialogTitle>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                Ação Irreversível
                            </p>
                        </div>
                    </div>

                    <DialogDescription className="text-sm text-zinc-500 leading-relaxed font-medium">
                        {description}
                    </DialogDescription>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 rounded-2xl py-6 text-[11px] font-bold uppercase tracking-widest border-zinc-100 hover:bg-zinc-50 transition-all h-auto"
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            type="button"
                            onClick={onConfirm}
                            className={cn(
                                "flex-1 rounded-2xl py-6 text-[11px] font-bold uppercase tracking-widest transition-all h-auto shadow-lg",
                                isDanger
                                    ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-200"
                            )}
                            disabled={isLoading}
                        >
                            {isLoading ? "Processando..." : confirmText}
                        </Button>
                    </div>
                </div>

                {/* Subtle Decorative Gradient */}
                <div className={cn(
                    "absolute -bottom-20 -right-20 w-40 h-40 blur-[80px] rounded-full opacity-20",
                    isDanger ? "bg-red-600" : "bg-amber-600"
                )} />
            </DialogContent>
        </Dialog>
    );
}
