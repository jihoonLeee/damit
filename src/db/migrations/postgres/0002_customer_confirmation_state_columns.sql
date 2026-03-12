ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS confirmation_note TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS request_ip TEXT;

ALTER TABLE customer_confirmation_links
  ADD COLUMN IF NOT EXISTS user_agent TEXT;