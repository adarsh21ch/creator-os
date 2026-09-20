-- Adarsh asked to paste his AI keys directly in the Settings screen instead of setting them
-- as Edge Function secrets manually. Store them here, behind the same RLS as everything else
-- (authenticated-only, anon has no access - see 0004). Additive only, nothing dropped.
--
-- Note for whoever builds the first AI employee (Studio, Phase 2): read the key from here at
-- request time using the service_role key (server-side only, never the anon key), rather than
-- wiring a separate Edge Function secret. This table is the single source of truth for both.

set search_path to creator_os, public;

alter table app_settings add column if not exists anthropic_api_key text;
alter table app_settings add column if not exists gemini_api_key text;
