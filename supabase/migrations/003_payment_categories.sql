create table if not exists public.payment_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_payment_categories_updated_at on public.payment_categories;
create trigger trg_payment_categories_updated_at
before update on public.payment_categories
for each row execute procedure public.set_updated_at();

alter table public.payment_categories enable row level security;

drop policy if exists service_role_all_payment_categories on public.payment_categories;
create policy service_role_all_payment_categories
on public.payment_categories
for all
to service_role
using (true)
with check (true);
