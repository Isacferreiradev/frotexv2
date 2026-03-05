import {
    pgTable,
    uuid,
    text,
    timestamp,
    boolean,
    numeric,
    integer,
    jsonb,
    date,
    uniqueIndex,
    index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ========== TENANTS ==========
export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    name: text('name').notNull(),
    cnpj: text('cnpj').unique(),
    contactEmail: text('contact_email'),
    phoneNumber: text('phone_number'),
    address: text('address'),
    settings: jsonb('settings').notNull().default({
        currency: 'BRL',
        locale: 'pt-BR',
        contractTemplateId: null,
        whatsappApiKey: null,
        overdueFinePercentage: 10,
        gracePeriodMinutes: 60,
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    logoUrl: text('logo_url'),
    asaasApiKey: text('asaas_api_key'),
    asaasWalletId: text('asaas_wallet_id'),
    stripeSecretKey: text('stripe_secret_key'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    paymentProvider: text('payment_provider', { enum: ['none', 'asaas', 'stripe'] }).default('none'),
    plan: text('plan', { enum: ['free', 'pro', 'scale'] }).notNull().default('free'),
    openingHours: jsonb('opening_hours').default({}), // e.g., { mon: { open: '08:00', close: '18:00' }, ... }
    nonWorkingDays: jsonb('non_working_days').default([]), // Array of dates or days of week
    themeConfig: jsonb('theme_config').default({ primaryColor: '#6d28d9', glassmorphism: true }),
    catalogSettings: jsonb('catalog_settings').default({ showPrices: true, showAvailability: true, whatsappDirect: true }),
    clientPortalSettings: jsonb('client_portal_settings').default({ allowExtensions: false, showFines: true }),
    publicName: text('public_name'),
    city: text('city'),
    state: text('state'),
    operationalProfile: jsonb('operational_profile').default({
        toolCountRange: null, // e.g., '0-20', '21-100', '100+'
        currentControlMethod: null, // e.g., 'paper', 'spreadsheet', 'other_system', 'none'
        activeRentalsRange: null, // e.g., '0-10', '11-50', '50+'
    }),
});

// ========== USERS ==========
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    role: text('role', { enum: ['owner', 'employee'] }).notNull().default('employee'),
    avatarUrl: text('avatar_url'),
    isActive: boolean('is_active').notNull().default(true),
    hasOnboarded: boolean('has_onboarded').notNull().default(false),
    onboardingStep: integer('onboarding_step').notNull().default(1),
    isVerified: boolean('is_verified').notNull().default(false),
    verificationToken: text('verification_token'),
    resetToken: text('reset_token'),
    resetTokenExpires: timestamp('reset_token_expires', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    lastActiveAt: timestamp('last_active_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== TOOL CATEGORIES ==========
export const toolCategories = pgTable(
    'tool_categories',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        description: text('description'),
        iconName: text('icon_name'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [uniqueIndex('uq_tool_categories_tenant_name').on(t.tenantId, t.name)]
);

// ========== TOOLS ==========
export const tools = pgTable(
    'tools',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        categoryId: uuid('category_id').notNull().references(() => toolCategories.id, { onDelete: 'restrict' }),
        name: text('name').notNull(),
        brand: text('brand'),
        model: text('model'),
        serialNumber: text('serial_number'),
        assetTag: text('asset_tag'),
        dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).notNull().default('0.00'),
        status: text('status', {
            enum: ['available', 'rented', 'maintenance', 'unavailable', 'lost', 'sold'],
        }).notNull().default('available'),
        lastMaintenanceAt: timestamp('last_maintenance_at', { withTimezone: true }),
        nextMaintenanceDueHours: numeric('next_maintenance_due_hours', { precision: 10, scale: 2 }),
        maintenanceIntervalDays: integer('maintenance_interval_days'),
        maintenanceIntervalRentals: integer('maintenance_interval_rentals'),
        currentUsageHours: numeric('current_usage_hours', { precision: 10, scale: 2 }).default('0.00'),
        imageUrl: text('image_url'),
        notes: text('notes'),
        acquisitionDate: date('acquisition_date'),
        acquisitionCost: numeric('acquisition_cost', { precision: 10, scale: 2 }).default('0.00'),
        minRentalValue: numeric('min_rental_value', { precision: 10, scale: 2 }).default('0.00'),
        cleaningFee: numeric('cleaning_fee', { precision: 10, scale: 2 }).default('0.00'),
        images: jsonb('images').default([]), // Array of image URLs
        subcategoryId: uuid('subcategory_id'), // Optional subcategory
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_tools_tenant_id').on(t.tenantId),
        index('idx_tools_category_id').on(t.categoryId),
        index('idx_tools_status').on(t.status),
    ]
);

// ========== CUSTOMERS ==========
export const customers = pgTable(
    'customers',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        fullName: text('full_name').notNull(),
        documentType: text('document_type', { enum: ['CPF', 'CNPJ'] }).notNull().default('CPF'),
        documentNumber: text('document_number').notNull(),
        phoneNumber: text('phone_number').notNull(),
        email: text('email'),
        addressStreet: text('address_street'),
        addressNumber: text('address_number'),
        addressComplement: text('address_complement'),
        addressNeighborhood: text('address_neighborhood'),
        addressCity: text('address_city'),
        addressState: text('address_state'),
        addressZipCode: text('address_zip_code'),
        isBlocked: boolean('is_blocked').notNull().default(false),
        creditLimit: numeric('credit_limit', { precision: 10, scale: 2 }).default('0.00'),
        allowLateRentals: boolean('allow_late_rentals').notNull().default(true),
        classification: text('classification', { enum: ['vip', 'new', 'risk', 'inactive'] }).notNull().default('new'),
        source: text('source'), // Origem do cliente
        tags: text('tags').array(),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_customers_tenant_id').on(t.tenantId),
        index('idx_customers_document_number').on(t.documentNumber),
        uniqueIndex('uq_customers_tenant_doc').on(t.tenantId, t.documentType, t.documentNumber),
    ]
);

// ========== CLIENT COMMUNICATIONS ==========
export const clientCommunications = pgTable('client_communications', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    type: text('type', { enum: ['call', 'note', 'whatsapp'] }).notNull(),
    message: text('message').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== QUOTES ==========
export const quotes = pgTable('quotes', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
    quoteCode: text('quote_code').notNull(),
    status: text('status', { enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'] }).notNull().default('draft'),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDateExpected: timestamp('end_date_expected', { withTimezone: true }).notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull().default('0.00'),
    totalDiscount: numeric('total_discount', { precision: 10, scale: 2 }).default('0.00'),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    notes: text('notes'),
    termsAndConditions: text('terms_and_conditions'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== QUOTE ITEMS ==========
export const quoteItems = pgTable('quote_items', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    quoteId: uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
    toolId: uuid('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    dailyRate: numeric('daily_rate', { precision: 10, scale: 2 }).notNull(),
    totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
    notes: text('notes'),
});

// ========== RENTALS ==========
export const rentals = pgTable(
    'rentals',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        toolId: uuid('tool_id').notNull().references(() => tools.id, { onDelete: 'restrict' }),
        customerId: uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
        rentalCode: text('rental_code').notNull(),
        startDate: timestamp('start_date', { withTimezone: true }).notNull(),
        endDateExpected: timestamp('end_date_expected', { withTimezone: true }).notNull(),
        endDateActual: timestamp('end_date_actual', { withTimezone: true }),
        dailyRateAgreed: numeric('daily_rate_agreed', { precision: 10, scale: 2 }).notNull(),
        totalDaysExpected: integer('total_days_expected').notNull(),
        totalDaysActual: integer('total_days_actual'),
        totalAmountExpected: numeric('total_amount_expected', { precision: 10, scale: 2 }).notNull(),
        totalAmountActual: numeric('total_amount_actual', { precision: 10, scale: 2 }),
        overdueFineAmount: numeric('overdue_fine_amount', { precision: 10, scale: 2 }).default('0.00'),
        status: text('status', {
            enum: ['active', 'returned', 'overdue', 'cancelled', 'lost'],
        }).notNull().default('active'),
        rentalType: text('rental_type', { enum: ['daily', 'weekly', 'monthly', 'custom'] }).notNull().default('daily'),
        discountType: text('discount_type', { enum: ['fixed', 'percentage'] }).default('percentage'),
        discountValue: numeric('discount_value', { precision: 10, scale: 2 }).default('0.00'),
        securityDeposit: numeric('security_deposit', { precision: 10, scale: 2 }).default('0.00'), // Caução
        toleranceMinutes: integer('tolerance_minutes'), // Store override
        internalNotes: text('internal_notes'),
        customerNotes: text('customer_notes'),
        templateId: uuid('template_id').references(() => contractTemplates.id, { onDelete: 'set null' }),
        contractPdfUrl: text('contract_pdf_url'),
        checkoutBy: uuid('checkout_by').references(() => users.id),
        checkinBy: uuid('checkin_by').references(() => users.id),
        equipmentCondition: text('equipment_condition', { enum: ['excellent', 'good', 'fair', 'poor'] }),
        usageHours: numeric('usage_hours', { precision: 10, scale: 2 }), // Hours used during THIS rental
        damageNotes: text('damage_notes'),
        notes: text('notes'),
        lastNotificationDate: timestamp('last_notification_date', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_rentals_tenant_id').on(t.tenantId),
        index('idx_rentals_tool_id').on(t.toolId),
        index('idx_rentals_customer_id').on(t.customerId),
        index('idx_rentals_status').on(t.status),
        index('idx_rentals_end_date_expected').on(t.endDateExpected),
        uniqueIndex('uq_rentals_tenant_code').on(t.tenantId, t.rentalCode),
    ]
);

// ========== PAYMENTS ==========
export const payments = pgTable(
    'payments',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        rentalId: uuid('rental_id').notNull().references(() => rentals.id, { onDelete: 'cascade' }),
        amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
        paymentDate: timestamp('payment_date', { withTimezone: true }).notNull().defaultNow(),
        paymentMethod: text('payment_method', {
            enum: ['cash', 'pix', 'credit_card', 'debit_card', 'bank_transfer'],
        }).notNull(),
        status: text('status', {
            enum: ['completed', 'pending', 'failed', 'refunded'],
        }).notNull().default('completed'),
        notes: text('notes'),
        receivedBy: uuid('received_by').references(() => users.id),
        gatewayId: text('gateway_id'),
        gatewayStatus: text('gateway_status'), // manual, pending, received, confirmed, overdue, refunded
        paymentLink: text('payment_link'),
        pixCopyPaste: text('pix_copy_paste'),
        pixQrCode: text('pix_qr_code'),
        invoiceUrl: text('invoice_url'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_payments_tenant_id').on(t.tenantId),
        index('idx_payments_rental_id').on(t.rentalId),
    ]
);

// ========== MAINTENANCE LOGS ==========
export const maintenanceLogs = pgTable(
    'maintenance_logs',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        toolId: uuid('tool_id').notNull().references(() => tools.id, { onDelete: 'cascade' }),
        maintenanceDate: timestamp('maintenance_date', { withTimezone: true }).notNull().defaultNow(),
        description: text('description').notNull(),
        cost: numeric('cost', { precision: 10, scale: 2 }).default('0.00'),
        performedBy: uuid('performed_by').references(() => users.id),
        notes: text('notes'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_maintenance_logs_tenant_id').on(t.tenantId),
        index('idx_maintenance_logs_tool_id').on(t.toolId),
    ]
);

// ========== CONTRACT TEMPLATES ==========
export const contractTemplates = pgTable(
    'contract_templates',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        name: text('name').notNull(),
        content: text('content').notNull(), // Template text with variables: {{customer_name}}, {{tool_name}}, etc.
        isDefault: boolean('is_default').notNull().default(false),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_contract_templates_tenant_id').on(t.tenantId),
    ]
);

// ========== EXPENSES (Custo Operacional) ==========
export const expenses = pgTable(
    'expenses',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        category: text('category').notNull(), // Manutenção, Aquisição, Marketing, Operacional, etc.
        description: text('description').notNull(),
        amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
        date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
        refId: uuid('ref_id'), // ID de referência (ex: manutenção_log_id)
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_expenses_tenant_id').on(t.tenantId),
    ]
);

// ========== OTHER REVENUES (Venda de Acessórios, Serviços, etc.) ==========
export const otherRevenues = pgTable(
    'other_revenues',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        category: text('category').notNull(), // Acessórios, Serviços, Vendas, etc.
        description: text('description').notNull(),
        amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
        date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_other_revenues_tenant_id').on(t.tenantId),
    ]
);

// ========== STORE AUTOMATION SETTINGS ==========
export const storeAutomationSettings = pgTable('store_automation_settings', {
    id: uuid('id').primaryKey().defaultRandom().notNull(),
    tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
    whatsappEnabled: boolean('whatsapp_enabled').notNull().default(false),
    notifyOnDueDate: boolean('notify_on_due_date').notNull().default(true),
    daysAfterDue: integer('days_after_due').notNull().default(1),
    finePerDay: numeric('fine_per_day', { precision: 10, scale: 2 }).notNull().default('0.00'),
    messageTemplate: text('message_template').notNull().default('Olá {{nome}}, sua ferramenta {{ferramenta}} está atrasada há {{dias}} dias. Multa atual: R$ {{multa}}. Entre em contato para regularizar.'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ========== ACTIVITY LOGS ==========
export const activityLogs = pgTable(
    'activity_logs',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        userId: uuid('user_id').references(() => users.id),
        action: text('action').notNull(), // e.g., 'CREATE_RENTAL', 'UPDATE_TOOL'
        entityType: text('entity_type').notNull(), // e.g., 'rental', 'tool', 'customer'
        entityId: uuid('entity_id'),
        details: jsonb('details'),
        ipAddress: text('ip_address'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_activity_logs_tenant_id').on(t.tenantId),
    ]
);

// ========== RENTAL EVENTS (Professional Timeline) ==========
export const rentalEvents = pgTable(
    'rental_events',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        rentalId: uuid('rental_id').notNull().references(() => rentals.id, { onDelete: 'cascade' }),
        userId: uuid('user_id').references(() => users.id),
        type: text('type').notNull(), // e.g., 'CHECKOUT', 'EXTENSION', 'ALARM', 'PAYMENT', 'CHECKIN'
        description: text('description').notNull(),
        details: jsonb('details').default({}),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_rental_events_rental_id').on(t.rentalId),
        index('idx_rental_events_type').on(t.type),
    ]
);

// ========== RELATIONS ==========
export const tenantsRelations = relations(tenants, ({ many }) => ({
    users: many(users),
    toolCategories: many(toolCategories),
    tools: many(tools),
    customers: many(customers),
    rentals: many(rentals),
    payments: many(payments),
    maintenanceLogs: many(maintenanceLogs),
    activityLogs: many(activityLogs),
    contractTemplates: many(contractTemplates),
    expenses: many(expenses),
    otherRevenues: many(otherRevenues),
    quotes: many(quotes),
    clientCommunications: many(clientCommunications),
    storeAutomationSettings: many(storeAutomationSettings),
    rentalEvents: many(rentalEvents),
}));

export const usersRelations = relations(users, ({ one }) => ({
    tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const toolCategoriesRelations = relations(toolCategories, ({ one, many }) => ({
    tenant: one(tenants, { fields: [toolCategories.tenantId], references: [tenants.id] }),
    tools: many(tools),
}));

export const toolsRelations = relations(tools, ({ one, many }) => ({
    tenant: one(tenants, { fields: [tools.tenantId], references: [tenants.id] }),
    category: one(toolCategories, { fields: [tools.categoryId], references: [toolCategories.id] }),
    rentals: many(rentals),
    maintenanceLogs: many(maintenanceLogs),
    quoteItems: many(quoteItems) // Changed from quotes: many(quotes)
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
    tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
    rentals: many(rentals),
    quotes: many(quotes),
    clientCommunications: many(clientCommunications),
}));

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
    tenant: one(tenants, { fields: [rentals.tenantId], references: [tenants.id] }),
    tool: one(tools, { fields: [rentals.toolId], references: [tools.id] }),
    customer: one(customers, { fields: [rentals.customerId], references: [customers.id] }),
    payments: many(payments),
    template: one(contractTemplates, { fields: [rentals.templateId], references: [contractTemplates.id] }),
    checkoutUser: one(users, { fields: [rentals.checkoutBy], references: [users.id] }),
    checkinUser: one(users, { fields: [rentals.checkinBy], references: [users.id] }),
    events: many(rentalEvents),
}));

export const rentalEventsRelations = relations(rentalEvents, ({ one }) => ({
    tenant: one(tenants, { fields: [rentalEvents.tenantId], references: [tenants.id] }),
    rental: one(rentals, { fields: [rentalEvents.rentalId], references: [rentals.id] }),
    user: one(users, { fields: [rentalEvents.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
    tenant: one(tenants, { fields: [payments.tenantId], references: [tenants.id] }),
    rental: one(rentals, { fields: [payments.rentalId], references: [rentals.id] }),
    receivedByUser: one(users, { fields: [payments.receivedBy], references: [users.id] }),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
    tenant: one(tenants, { fields: [maintenanceLogs.tenantId], references: [tenants.id] }),
    tool: one(tools, { fields: [maintenanceLogs.toolId], references: [tools.id] }),
    performedByUser: one(users, { fields: [maintenanceLogs.performedBy], references: [users.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
    tenant: one(tenants, { fields: [activityLogs.tenantId], references: [tenants.id] }),
    user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));

export const contractTemplatesRelations = relations(contractTemplates, ({ one }) => ({
    tenant: one(tenants, { fields: [contractTemplates.tenantId], references: [tenants.id] }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
    tenant: one(tenants, { fields: [quotes.tenantId], references: [tenants.id] }),
    customer: one(customers, { fields: [quotes.customerId], references: [customers.id] }),
    items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
    tenant: one(tenants, { fields: [quoteItems.tenantId], references: [tenants.id] }),
    quote: one(quotes, { fields: [quoteItems.quoteId], references: [quotes.id] }),
    tool: one(tools, { fields: [quoteItems.toolId], references: [tools.id] }),
}));

export const clientCommunicationsRelations = relations(clientCommunications, ({ one }) => ({
    tenant: one(tenants, { fields: [clientCommunications.tenantId], references: [tenants.id] }),
    customer: one(customers, { fields: [clientCommunications.customerId], references: [customers.id] }),
    user: one(users, { fields: [clientCommunications.userId], references: [users.id] }),
}));

export const storeAutomationSettingsRelations = relations(storeAutomationSettings, ({ one }) => ({
    tenant: one(tenants, { fields: [storeAutomationSettings.tenantId], references: [tenants.id] }),
}));

// Export all schemas for Drizzle Kit
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ToolCategory = typeof toolCategories.$inferSelect;
export type NewToolCategory = typeof toolCategories.$inferInsert;
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Rental = typeof rentals.$inferSelect;
export type NewRental = typeof rentals.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type NewMaintenanceLog = typeof maintenanceLogs.$inferInsert;
export const checklists = pgTable(
    'checklists',
    {
        id: uuid('id').primaryKey().defaultRandom().notNull(),
        tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
        rentalId: uuid('rental_id').notNull().references(() => rentals.id, { onDelete: 'cascade' }),
        type: text('type', { enum: ['check-in', 'check-out'] }).notNull(),
        items: jsonb('items').notNull().default([]), // Array de strings ou objetos {item, checked}
        condition: text('condition', { enum: ['excellent', 'good', 'fair', 'poor'] }).notNull(),
        notes: text('notes'),
        photos: jsonb('photos').notNull().default([]), // URLs das fotos no S3/R2
        signatureUrl: text('signature_url'),
        inspectorId: uuid('inspector_id').references(() => users.id),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
        index('idx_checklists_rental_id').on(t.rentalId),
    ]
);

export const checklistsRelations = relations(checklists, ({ one }) => ({
    rental: one(rentals, { fields: [checklists.rentalId], references: [rentals.id] }),
    inspector: one(users, { fields: [checklists.inspectorId], references: [users.id] }),
}));

export type Checklist = typeof checklists.$inferSelect;
export type NewChecklist = typeof checklists.$inferInsert;
export type QuoteItem = typeof quoteItems.$inferSelect;
export type NewQuoteItem = typeof quoteItems.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type NewContractTemplate = typeof contractTemplates.$inferInsert;
export type Expense = typeof expenses.$inferSelect;
export type NewExpense = typeof expenses.$inferInsert;
export type Quote = typeof quotes.$inferSelect;
export type NewQuote = typeof quotes.$inferInsert;
export type ClientCommunication = typeof clientCommunications.$inferSelect;
export type NewClientCommunication = typeof clientCommunications.$inferInsert;
export type OtherRevenue = typeof otherRevenues.$inferSelect;
export type NewOtherRevenue = typeof otherRevenues.$inferInsert;
export type StoreAutomationSettings = typeof storeAutomationSettings.$inferSelect;
export type NewStoreAutomationSettings = typeof storeAutomationSettings.$inferInsert;
export type RentalEvent = typeof rentalEvents.$inferSelect;
export type NewRentalEvent = typeof rentalEvents.$inferInsert;

