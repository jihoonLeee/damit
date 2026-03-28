ALTER TABLE job_cases
  ADD COLUMN IF NOT EXISTS customer_phone_number TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_channel TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_provider TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_status TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_destination TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_requested_at TIMESTAMPTZ;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_message_id TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_error_code TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS delivery_error_message TEXT;
