-- Create app_employees table for PIN-based employee authentication
create table if not exists app_employees (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin_hash    text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Enable RLS — no policies means only service role can access
alter table app_employees enable row level security;
