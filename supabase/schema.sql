create table if not exists public.app_state (
  id text primary key,
  schedule jsonb not null default '{}'::jsonb,
  meal_batches jsonb not null default '[]'::jsonb,
  shopping_items jsonb not null default '[]'::jsonb,
  pantry_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.app_state
add column if not exists pantry_items jsonb not null default '[]'::jsonb;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists app_state_set_updated_at on public.app_state;

create trigger app_state_set_updated_at
before update on public.app_state
for each row
execute function public.set_updated_at();

alter table public.app_state enable row level security;

insert into public.app_state (id)
values ('default')
on conflict (id) do nothing;
