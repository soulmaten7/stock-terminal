-- 이메일 모닝 브리핑 opt-in 구독(STEP 784) — Cowork이 MCP로 선적용 완료(archival 기록용, 재실행 시 idempotent).
create table if not exists public.email_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_brief boolean not null default false,
  locale text not null default 'ko',
  unsub_token uuid not null default gen_random_uuid(),
  updated_at timestamptz not null default now()
);

alter table public.email_subscriptions enable row level security;

-- 본인 행만 조회/등록/수정 — 삭제는 없음(구독 해제는 daily_brief=false로 표현, revoke로 delete 자체를 막음).
create policy "own row select" on public.email_subscriptions for select using (auth.uid() = user_id);
create policy "own row insert" on public.email_subscriptions for insert with check (auth.uid() = user_id);
create policy "own row update" on public.email_subscriptions for update using (auth.uid() = user_id);
revoke delete on public.email_subscriptions from anon, authenticated;
