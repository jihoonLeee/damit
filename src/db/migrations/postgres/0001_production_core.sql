CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  phone_number TEXT,
  status TEXT NOT NULL,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  plan_code TEXT NOT NULL DEFAULT 'BASIC',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  invited_by_user_id TEXT REFERENCES users(id),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (company_id, user_id)
);

CREATE TABLE IF NOT EXISTS login_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  request_ip TEXT,
  delivery_provider TEXT,
  delivery_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  membership_id TEXT NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invitations (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by_user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_cases (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  owner_id TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  assigned_user_id TEXT REFERENCES users(id),
  updated_by_user_id TEXT REFERENCES users(id),
  visibility TEXT NOT NULL DEFAULT 'PRIVATE_ASSIGNED',
  customer_label TEXT NOT NULL,
  contact_memo TEXT,
  site_label TEXT NOT NULL,
  original_quote_amount INTEGER NOT NULL,
  revised_quote_amount INTEGER,
  quote_delta_amount INTEGER,
  current_status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS field_records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  owner_id TEXT,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  job_case_id TEXT REFERENCES job_cases(id) ON DELETE SET NULL,
  primary_reason TEXT NOT NULL,
  secondary_reason TEXT,
  note TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS field_record_photos (
  id TEXT PRIMARY KEY,
  field_record_id TEXT NOT NULL REFERENCES field_records(id) ON DELETE CASCADE,
  storage_provider TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT,
  url TEXT,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS scope_comparisons (
  id TEXT PRIMARY KEY,
  job_case_id TEXT NOT NULL REFERENCES job_cases(id) ON DELETE CASCADE,
  base_scope_summary TEXT NOT NULL,
  extra_work_summary TEXT NOT NULL,
  reason_why_extra TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS message_drafts (
  id TEXT PRIMARY KEY,
  job_case_id TEXT NOT NULL REFERENCES job_cases(id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(id),
  tone TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS agreement_records (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_case_id TEXT NOT NULL REFERENCES job_cases(id) ON DELETE CASCADE,
  created_by_user_id TEXT REFERENCES users(id),
  status TEXT NOT NULL,
  confirmation_channel TEXT NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL,
  confirmed_amount INTEGER,
  customer_response_note TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_case_id TEXT NOT NULL REFERENCES job_cases(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id),
  event_type TEXT NOT NULL,
  summary TEXT NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id),
  actor_type TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  request_id TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_confirmation_links (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  job_case_id TEXT NOT NULL REFERENCES job_cases(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_by_user_id TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_confirmation_events (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES customer_confirmation_links(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  request_ip TEXT,
  user_agent TEXT,
  confirmation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_cases_company_updated ON job_cases (company_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_cases_company_status_updated ON job_cases (company_id, current_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_cases_company_visibility_updated ON job_cases (company_id, visibility, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_field_records_company_created ON field_records (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agreement_records_job_created ON agreement_records (job_case_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memberships_company_status ON memberships (company_id, status);
CREATE INDEX IF NOT EXISTS idx_memberships_user_status ON memberships (user_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_created ON audit_logs (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_confirmation_links_job_status ON customer_confirmation_links (job_case_id, status);
