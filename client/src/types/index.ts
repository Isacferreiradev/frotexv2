export interface User {
    id: string;
    email: string;
    fullName: string;
    role: 'owner' | 'employee';
    tenantId: string;
    avatarUrl?: string | null;
    isVerified: boolean;
    hasOnboarded: boolean;
}

export interface Tenant {
    id: string;
    name: string;
    cnpj?: string | null;
    phoneNumber?: string | null;
    city?: string | null;
    state?: string | null;
    logoUrl?: string | null;
    plan: 'free' | 'pro' | 'scale';
}

export interface ToolCategory {
    id: string;
    tenantId: string;
    name: string;
    description?: string | null;
    iconName?: string | null;
    createdAt: string;
}

export interface Tool {
    id: string;
    tenantId: string;
    categoryId: string;
    name: string;
    brand?: string | null;
    assetTag?: string | null;
    serialNumber?: string | null;
    status: 'available' | 'rented' | 'maintenance' | 'retired' | 'lost';
    dailyRate?: string | null;
    weeklyRate?: string | null;
    acquisitionDate?: string | null;
    acquisitionCost?: string | null;
    currentUsageHours?: string | null;
    nextMaintenanceDueHours?: string | null;
    maintenanceIntervalDays?: number | null;
    lastMaintenanceAt?: string | null;
    warrantyExpiresAt?: string | null;
    notes?: string | null;
    category?: ToolCategory;
    categoryName?: string; // used in some frontend contexts
}

export interface Customer {
    id: string;
    tenantId: string;
    fullName: string;
    documentNumber: string;
    documentType: 'cpf' | 'cnpj';
    email?: string | null;
    phoneNumber?: string | null;
    address?: string | null;
    isBlocked: boolean;
    notes?: string | null;
    tags?: string[] | null;
}

export interface Rental {
    id: string;
    tenantId: string;
    toolId: string;
    customerId: string;
    rentalCode: string;
    startDate: string;
    endDateExpected: string;
    endDateActual?: string | null;
    dailyRateAgreed: string;
    totalDaysExpected: number;
    totalDaysActual?: number | null;
    totalAmountExpected: string;
    totalAmountActual?: string | null;
    overdueFineAmount?: string | null;
    status: 'active' | 'returned' | 'overdue' | 'cancelled';
    rentalType: 'daily' | 'weekly' | 'monthly' | 'custom';
    discountType: 'fixed' | 'percentage';
    discountValue: string;
    securityDeposit: string;
    equipmentCondition: 'excellent' | 'good' | 'fair' | 'poor';
    customerNotes?: string | null;
    notes?: string | null;
    tool?: Tool;
    customer?: Customer;
}

export interface MaintenanceLog {
    id: string;
    tenantId: string;
    toolId: string;
    maintenanceDate: string;
    type: 'preventive' | 'corrective';
    cost: string;
    description: string;
    performedBy?: string | null;
    usageHoursAtMaintenance?: string | null;
    tool?: Tool;
}

export interface Quote {
    id: string;
    tenantId: string;
    customerId: string;
    quoteCode: string;
    validUntil: string;
    totalAmount: string;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
    items: QuoteItem[];
    customer?: Customer;
    notes?: string | null;
}

export interface QuoteItem {
    id?: string;
    toolId: string;
    dailyRate: string;
    expectedDays: number;
    totalAmount: string;
    tool?: Tool;
}

export interface Payment {
    id: string;
    tenantId: string;
    rentalId: string;
    amount: string;
    paymentDate: string;
    paymentMethod: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'bank_transfer';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    receivedBy: string;
    notes?: string | null;
}
