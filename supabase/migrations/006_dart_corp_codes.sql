-- DART CORPCODE → 종목코드 매핑
create table if not exists public.dart_corp_codes (
  corp_code text primary key,
  corp_name text,
  stock_code text unique,
  created_at timestamptz default now()
);

create index if not exists idx_dart_corp_codes_stock_code
  on public.dart_corp_codes (stock_code);

alter table public.dart_corp_codes enable row level security;

create policy "public read dart_corp_codes"
  on public.dart_corp_codes for select
  using (true);
