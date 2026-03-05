ALTER TABLE "tenants" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "operational_profile" jsonb DEFAULT '{"toolCountRange":null,"currentControlMethod":null,"activeRentalsRange":null}'::jsonb;
