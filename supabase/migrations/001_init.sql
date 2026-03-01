create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null unique,
  display_name text not null default '나',
  base_salary numeric not null default 0,
  currency text not null default 'KRW',
  created_at timestamptz not null default now()
);

create table if not exists public.purpose_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  purpose_type text not null,
  bank_name text not null default '',
  card_name text not null default '',
  monthly_limit numeric not null default 0,
  usage_summary text not null default '',
  note text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.living_groups (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  group_type text not null,
  label text not null,
  default_amount numeric not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  yyyymm text not null,
  salary_amount numeric not null default 0,
  carry_cash_from_prev numeric not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, yyyymm)
);

create table if not exists public.planned_items (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  month_id uuid not null references public.months(id) on delete cascade,
  category_type text not null,
  item_name text not null,
  amount numeric not null default 0,
  card_name text not null default '',
  memo text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.actual_items (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  month_id uuid not null references public.months(id) on delete cascade,
  category_type text not null,
  item_name text not null,
  amount numeric not null default 0,
  card_name text not null default '',
  memo text not null default '',
  is_from_plan boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_purpose_accounts_updated_at on public.purpose_accounts;
create trigger trg_purpose_accounts_updated_at
before update on public.purpose_accounts
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_living_groups_updated_at on public.living_groups;
create trigger trg_living_groups_updated_at
before update on public.living_groups
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_months_updated_at on public.months;
create trigger trg_months_updated_at
before update on public.months
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_planned_items_updated_at on public.planned_items;
create trigger trg_planned_items_updated_at
before update on public.planned_items
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_actual_items_updated_at on public.actual_items;
create trigger trg_actual_items_updated_at
before update on public.actual_items
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.purpose_accounts enable row level security;
alter table public.living_groups enable row level security;
alter table public.months enable row level security;
alter table public.planned_items enable row level security;
alter table public.actual_items enable row level security;

drop policy if exists service_role_all_profiles on public.profiles;
create policy service_role_all_profiles
on public.profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_purpose_accounts on public.purpose_accounts;
create policy service_role_all_purpose_accounts
on public.purpose_accounts
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_living_groups on public.living_groups;
create policy service_role_all_living_groups
on public.living_groups
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_months on public.months;
create policy service_role_all_months
on public.months
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_planned_items on public.planned_items;
create policy service_role_all_planned_items
on public.planned_items
for all
to service_role
using (true)
with check (true);

drop policy if exists service_role_all_actual_items on public.actual_items;
create policy service_role_all_actual_items
on public.actual_items
for all
to service_role
using (true)
with check (true);

create or replace view public.monthly_summary as
select
  m.id as month_id,
  m.owner_id,
  m.yyyymm,
  coalesce(sum(case when p.category_type in ('고정저축', '유동지출', '고정지출', '고정투자', '추가지출') then p.amount else 0 end), 0) as planned_total,
  coalesce(sum(case when a.category_type in ('고정저축', '유동지출', '고정지출', '고정투자', '추가지출') then a.amount else 0 end), 0) as actual_total,
  now() as updated_at
from public.months m
left join public.planned_items p on p.month_id = m.id
left join public.actual_items a on a.month_id = m.id
group by m.id, m.owner_id, m.yyyymm;
