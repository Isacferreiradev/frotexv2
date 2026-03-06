-- Reconciliation of Quotes and missing system tables
-- This migration ensures environment-parity since the automated generator was blocked.

-- 1. Table users (missing from some environments)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "onboarding_step" integer DEFAULT 1 NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token" text;

-- 2. Table quotes
CREATE TABLE IF NOT EXISTS "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"quote_code" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date_expected" timestamp with time zone NOT NULL,
	"total_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"total_discount" numeric(10, 2) DEFAULT '0.00',
	"valid_until" timestamp with time zone,
	"notes" text,
	"terms_and_conditions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. Table quote_items
CREATE TABLE IF NOT EXISTS "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"quote_id" uuid NOT NULL,
	"tool_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"daily_rate" numeric(10, 2) NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text
);

-- 4. Table store_automation_settings
CREATE TABLE IF NOT EXISTS "store_automation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"whatsapp_enabled" boolean DEFAULT false NOT NULL,
	"notify_on_due_date" boolean DEFAULT true NOT NULL,
	"days_after_due" integer DEFAULT 1 NOT NULL,
	"fine_per_day" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"message_template" text DEFAULT 'Olá {{nome}}, sua ferramenta {{ferramenta}} está atrasada há {{dias}} dias. Multa atual: R$ {{multa}}. Entre em contato para regularizar.' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 5. Foreign Keys (Safe Checks)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_tenant_id_tenants_id_fk') THEN
        ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_customer_id_customers_id_fk') THEN
        ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_items_tenant_id_tenants_id_fk') THEN
        ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_items_quote_id_quotes_id_fk') THEN
        ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_items_tool_id_tools_id_fk') THEN
        ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'store_automation_settings_tenant_id_tenants_id_fk') THEN
        ALTER TABLE "store_automation_settings" ADD CONSTRAINT "store_automation_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;
