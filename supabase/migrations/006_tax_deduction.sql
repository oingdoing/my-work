alter table public.months
add column if not exists tax_deduction numeric not null default 0;
