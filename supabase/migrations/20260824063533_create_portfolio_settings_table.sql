/*
# Create portfolio_settings table for server-side persistence

1. Purpose
   - This portfolio site is a single-tenant app with a hardcoded admin login (not Supabase auth).
   - All admin panel edits (text, images, PDF links, skill values, etc.) need to persist server-side
     so they survive browser cache clears and are never lost.
   - The app uses a key-value pattern: each "key" identifies a data section (e.g. "mason_portfolio_projects_v2"),
     and "value" stores the full JSON payload (including base64-encoded images and PDF data URIs).

2. New Tables
   - `portfolio_settings`
     - `id` (uuid, primary key)
     - `key` (text, unique, not null) — the storage key used by the frontend
     - `value` (jsonb, not null) — the full JSON payload for that key
     - `updated_at` (timestamptz, default now()) — last modification timestamp

3. Security
   - Enable RLS on `portfolio_settings`.
   - This is a single-tenant app with no sign-in screen (admin login is hardcoded client-side),
     so the anon-key frontend must be able to read AND write. Use `TO anon, authenticated` with
     `USING (true)` / `WITH CHECK (true)` — the data is intentionally shared/public for this app.
   - 4 separate CRUD policies (select/insert/update/delete).

4. Notes
   - The `value` column is jsonb to support large JSON payloads including base64 image data URIs.
   - An index on `key` ensures fast lookups.
*/

CREATE TABLE IF NOT EXISTS portfolio_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_settings_key ON portfolio_settings (key);

ALTER TABLE portfolio_settings ENABLE ROW LEVEL SECURITY;

-- Allow anon + authenticated to read all settings (single-tenant, intentionally public)
DROP POLICY IF EXISTS "anon_select_portfolio_settings" ON portfolio_settings;
CREATE POLICY "anon_select_portfolio_settings"
ON portfolio_settings FOR SELECT
TO anon, authenticated USING (true);

-- Allow anon + authenticated to insert new settings
DROP POLICY IF EXISTS "anon_insert_portfolio_settings" ON portfolio_settings;
CREATE POLICY "anon_insert_portfolio_settings"
ON portfolio_settings FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Allow anon + authenticated to update existing settings
DROP POLICY IF EXISTS "anon_update_portfolio_settings" ON portfolio_settings;
CREATE POLICY "anon_update_portfolio_settings"
ON portfolio_settings FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

-- Allow anon + authenticated to delete settings
DROP POLICY IF EXISTS "anon_delete_portfolio_settings" ON portfolio_settings;
CREATE POLICY "anon_delete_portfolio_settings"
ON portfolio_settings FOR DELETE
TO anon, authenticated USING (true);
