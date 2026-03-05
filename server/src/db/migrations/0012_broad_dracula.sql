CREATE TABLE "rental_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"rental_id" uuid NOT NULL,
	"user_id" uuid,
	"type" text NOT NULL,
	"description" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "store_automation_settings" (
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
--> statement-breakpoint
DROP INDEX "idx_activity_logs_created_at";--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "settings" SET DEFAULT '{"currency":"BRL","locale":"pt-BR","contractTemplateId":null,"whatsappApiKey":null,"overdueFinePercentage":10,"gracePeriodMinutes":60}'::jsonb;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "credit_limit" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "allow_late_rentals" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "classification" text DEFAULT 'new' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "source" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "valid_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "rental_type" text DEFAULT 'daily' NOT NULL;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "discount_type" text DEFAULT 'percentage';--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "discount_value" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "security_deposit" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "tolerance_minutes" integer;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "customer_notes" text;--> statement-breakpoint
ALTER TABLE "rentals" ADD COLUMN "last_notification_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "opening_hours" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "non_working_days" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "theme_config" jsonb DEFAULT '{"primaryColor":"#6d28d9","glassmorphism":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "catalog_settings" jsonb DEFAULT '{"showPrices":true,"showAvailability":true,"whatsappDirect":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "client_portal_settings" jsonb DEFAULT '{"allowExtensions":false,"showFines":true}'::jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "public_name" text;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "min_rental_value" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "cleaning_fee" numeric(10, 2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "subcategory_id" uuid;--> statement-breakpoint
ALTER TABLE "rental_events" ADD CONSTRAINT "rental_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_events" ADD CONSTRAINT "rental_events_rental_id_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."rentals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_events" ADD CONSTRAINT "rental_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_automation_settings" ADD CONSTRAINT "store_automation_settings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_rental_events_rental_id" ON "rental_events" USING btree ("rental_id");--> statement-breakpoint
CREATE INDEX "idx_rental_events_type" ON "rental_events" USING btree ("type");