alter table public.months
add column if not exists additional_income_type text not null default '이월금액';
