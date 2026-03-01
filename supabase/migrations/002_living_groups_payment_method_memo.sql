alter table public.living_groups
add column if not exists payment_method text not null default '';

alter table public.living_groups
add column if not exists memo text not null default '';
