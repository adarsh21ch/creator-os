-- Fixes: "permission denied for schema creator_os"
--
-- Root cause: creating a schema in Postgres does NOT grant anyone access to it, even with RLS
-- policies already in place on its tables. RLS controls which ROWS a role can see once it's
-- allowed into the schema - it is not the same as being allowed in. The built-in "public" schema
-- comes pre-granted by Supabase's project bootstrap, which is why the original standalone
-- project never needed this step; a schema we create ourselves does not inherit that.
--
-- Run this once, same as 0004 and 0005 - paste into the Nevorai Tools SQL Editor and Run.

grant usage on schema creator_os to authenticated, service_role;

grant select, insert, update, delete on all tables in schema creator_os to authenticated;
grant all on all tables in schema creator_os to service_role;

grant usage, select on all sequences in schema creator_os to authenticated, service_role;

-- So any table added later (Phase 2+) gets the same access automatically, without another
-- migration like this one.
alter default privileges in schema creator_os
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema creator_os
  grant all on tables to service_role;
