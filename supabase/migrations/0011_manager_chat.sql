-- M-00 Chief of Staff, requested 2026-09-22: "one particular manager to talk
-- and say this team is not working correctly... update this thing."
--
-- Deliberately proposes, never applies directly -- an AI editing its own
-- operating instructions unsupervised is a real risk. The Manager reads an
-- employee's current settings, drafts one specific change with its
-- reasoning, and Adarsh applies or rejects it from the Manager screen. No
-- separate approval edge function needed: applying is just writing the
-- proposed value to the employees row, which the existing RLS already allows.

set search_path to creator_os, public;

create table if not exists manager_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'manager')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists manager_proposals (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references manager_messages(id) on delete set null,
  employee_id uuid not null references employees(id) on delete cascade,
  field text not null check (field in ('prompt', 'model', 'schedule', 'enabled')),
  old_value text,
  new_value text not null,
  rationale text,
  status text not null default 'pending' check (status in ('pending', 'applied', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists manager_proposals_status_idx on manager_proposals(status);

alter table manager_messages enable row level security;
alter table manager_proposals enable row level security;

create policy manager_messages_authenticated_all on manager_messages
  for all to authenticated using (true) with check (true);
create policy manager_proposals_authenticated_all on manager_proposals
  for all to authenticated using (true) with check (true);

-- M-00 is now a real, working employee -- flip it on.
update employees set enabled = true where code = 'M-00';
