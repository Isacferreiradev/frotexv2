-- Custom SQL migration file, put your code below! --
ALTER TABLE "store_automation_settings" ADD COLUMN IF NOT EXISTS "whatsapp_instance_name" text;
ALTER TABLE "store_automation_settings" ADD COLUMN IF NOT EXISTS "whatsapp_instance_status" text DEFAULT 'disconnected';