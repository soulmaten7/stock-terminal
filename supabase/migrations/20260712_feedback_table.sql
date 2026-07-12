-- 베타 피드백 수집 테이블 (2026-07-12)
-- /api/feedback(서버 service-role)만 삽입 · 직접 접근 차단(RLS on + anon/authenticated REVOKE, 우리 보안 패턴 그대로)
-- 적용: 라이브(ccbwxcszdoyjxvckedfp) apply_migration 선반영, 본 파일은 리포지토리 기록.
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  first_impression text,
  trai_understood text,       -- 'clear' | 'vague' | 'unclear'
  most_useful text,
  bugs text,
  return_intent text,         -- 'yes' | 'maybe' | 'no'
  rating int,                 -- 1..5
  contact text,
  user_id uuid,
  path text
);
alter table public.feedback enable row level security;
revoke all on public.feedback from anon, authenticated;
