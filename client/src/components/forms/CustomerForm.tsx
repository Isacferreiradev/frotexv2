'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const customerSchema = z.object({
    fullName: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phoneNumber: z.string().min(8, 'Telefone obrigatório'),
    documentType: z.enum(['CPF', 'CNPJ']),
    documentNumber: z.string().min(11, 'Documento inválido'),
    addressStreet: z.string().optional(),
    addressNumber: z.string().optional(),
    addressComplement: z.string().optional(),
    addressNeighborhood: z.string().optional(),
    addressCity: z.string().optional(),
    addressState: z.string().length(2, 'UF deve ter 2 caracteres').optional().or(z.literal('')),
    addressZipCode: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    initialData?: any;
    onSubmit: (data: CustomerFormValues) => void;
    isLoading?: boolean;
}

const maskPhone = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
};

const maskDocument = (value: string, type: 'CPF' | 'CNPJ') => {
    const v = value.replace(/\D/g, '');
    if (type === 'CPF') {
        return v
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }
    return v
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
};

export function CustomerForm({ initialData, onSubmit, isLoading }: CustomerFormProps) {
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            documentType: 'CPF',
            tags: [],
            ...initialData,
        },
    });

    const currentTags = watch('tags') || [];
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
            setValue('tags', [...currentTags, tagInput.trim()]);
            setTagInput('');
        }
    };

    const removeTag = (tag: string) => {
        setValue('tags', currentTags.filter(t => t !== tag));
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="fullName">Nome Completo / Razão Social</Label>
                    <Input id="fullName" {...register('fullName')} placeholder="Nome do cliente" />
                    {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...register('email')} placeholder="cliente@exemplo.com" />
                    {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Telefone / WhatsApp</Label>
                    <Input
                        id="phoneNumber"
                        {...register('phoneNumber')}
                        placeholder="(11) 99999-9999"
                        onChange={(e) => {
                            const masked = maskPhone(e.target.value);
                            e.target.value = masked;
                            setValue('phoneNumber', masked);
                        }}
                    />
                    {errors.phoneNumber && <p className="text-xs text-red-500">{errors.phoneNumber.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Tipo Doc.</Label>
                    <Select
                        onValueChange={(v) => setValue('documentType', v as 'CPF' | 'CNPJ')}
                        defaultValue={initialData?.documentType || 'CPF'}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="documentNumber">Número Documento</Label>
                    <Input
                        id="documentNumber"
                        {...register('documentNumber')}
                        placeholder="Somente números"
                        onChange={(e) => {
                            const type = (document.querySelector('button[role="combobox"]') as any)?.innerText?.includes('CNPJ') ? 'CNPJ' : 'CPF';
                            const masked = maskDocument(e.target.value, type as any);
                            e.target.value = masked;
                            setValue('documentNumber', masked);
                        }}
                    />
                    {errors.documentNumber && <p className="text-xs text-red-500">{errors.documentNumber.message}</p>}
                </div>

                <div className="col-span-2 space-y-3 pt-4 border-t mt-2">
                    <Label>Segmentação (Tags)</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {currentTags.map(tag => (
                            <span key={tag} className="bg-violet-50 text-violet-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-2 border border-violet-100">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 font-extrabold">×</button>
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                            placeholder="Adicionar tag (ex: VIP, Recorrente)"
                            className="flex-1"
                        />
                        <Button type="button" onClick={addTag} variant="outline" className="text-xs">Add</Button>
                    </div>
                </div>

                <div className="col-span-2 grid grid-cols-3 gap-4 border-t pt-4 mt-2">

                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="addressStreet">Rua</Label>
                        <Input id="addressStreet" {...register('addressStreet')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="addressNumber">Nº</Label>
                        <Input id="addressNumber" {...register('addressNumber')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="addressNeighborhood">Bairro</Label>
                        <Input id="addressNeighborhood" {...register('addressNeighborhood')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="addressCity">Cidade</Label>
                        <Input id="addressCity" {...register('addressCity')} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="addressState">UF</Label>
                        <Input id="addressState" maxLength={2} {...register('addressState')} placeholder="Ex: SP" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-violet-50 mt-4">
                <Button type="submit" disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white font-bold uppercase tracking-widest text-[10px] py-6 rounded-xl shadow-lg shadow-violet-100 w-full sm:w-auto">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                </Button>
            </div>
        </form>
    );
}
