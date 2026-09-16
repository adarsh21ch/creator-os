-- SECURITY: lock the database down before this app is ever deployed publicly.
--
-- Why this is needed: VITE_SUPABASE_ANON_KEY ships inside the client JavaScript bundle,
-- so it is public by definition. With RLS disabled, anyone who opens creator.nevorai.com
-- can read every transcript, every strategy note, and can DELETE the whole database.
-- Verified 2026-09-16: an anon DELETE against `reels` returned HTTP 204.
--
-- DO NOT APPLY THIS MIGRATION ON ITS OWN. It requires Supabase Auth and a login screen in
-- the app at the same time, otherwise every screen goes blank (the anon key loses access
-- and there is no signed-in session to replace it).
--
-- Single-operator tool: any authenticated user is Adarsh, so one permissive policy per
-- table is enough. Revisit if a second person ever gets an account.

alter table reels              enable row level security;
alter table watchlist_accounts enable row level security;
alter table watchlist_posts    enable row level security;
alter table sources            enable row level security;
alter table news_stories       enable row level security;
alter table brand_brain        enable row level security;
alter table employees          enable row level security;
alter table app_settings       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['reels','watchlist_accounts','watclist_posts_placeholder'] loop
    null; -- placeholder guard, real loop below
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'reels','watchlist_accounts','watchlist_posts','sources',
    'news_stories','brand_brain','employees','app_settings'
  ] loop
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      t || '_authenticated_all', t
    );
    -- anon gets nothing at all
    execute format('revoke all on table %I from anon', t);
  end loop;
end $$;
