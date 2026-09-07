-- 20260907_channel_growth_stories.sql
-- 성장스토리(채널의 새 콘텐츠 유형 — "이 회사는 뭘 하는 회사이고 어떤 어려움에 어떻게
-- 대응했나") 종목 페이지 통합, B안(회사 소개 섹션을 리포트 위에 고정) — 채팅 지시,
-- ORDER 없음. channel_reports(리포트형, 종목당 여러 행이 시간순으로 쌓임)와 근본적으로
-- 다른 지점: 이 콘텐츠는 "현재 유효한 설명" 하나만 있으면 되므로 종목당 1행이 원칙이다
-- (symbol, country) UNIQUE로 강제 — 재제작(새 사업보고서 기준 갱신)은 그 행을 UPDATE한다,
-- 새 행을 쌓지 않는다(2026-09-07 사용자 확정: "사업보고서는 덮어쓰기 성격 — 2026년판이
-- 나오면 2025년판은 옛 정보지 다른 정보가 아니다").
--
-- source_doc(표시용 문자열, 예: "2026년 3월 사업보고서 (2025년 기준)")과 별개로
-- source_date(date 타입)를 둔다 — "새 보고서가 나왔는가"를 코드로 판정하려면 문자열
-- 비교로는 안 되고 정렬 가능한 날짜가 필요하다(2026-09-07 사용자 요청).
--
-- 원본 대본(CUT별 나레이션)은 이 테이블에 안 둔다 — 갱신 시 옛 대본이 사라지면 안 되므로
-- (영상으로 이미 나간 것이라 이력 가치가 있다, 2026-09-07 사용자 확정) 별도 append-only
-- 이력 테이블(channel_growth_story_scripts, 다음 마이그레이션)에 매 갱신마다 새 행으로 쌓는다.
create table if not exists public.channel_growth_stories (
  id             bigint generated always as identity primary key,

  symbol         text not null,
  stock_name     text not null,
  country        text not null default 'KR',

  source_doc     text not null,   -- 표시용: "2026년 3월 사업보고서 (2025년 기준)" / "June 2026 10-K (fiscal 2026 data)"
  source_date    date not null,   -- 판정용: 사업보고서/10-K 제출일 — 신규 보고서 여부 비교 기준

  intro          text not null,   -- 도입: 이 회사가 뭘 하나
  challenge      text not null,   -- 난관: 업계·회사의 구조적 어려움
  response       text not null,   -- 해결: 회사가 실제로 한 대응
  summary        text not null,   -- 요약

  video_url      text,            -- 유튜브 링크 — 업로드가 수동이라 채널이 알려주기 전까지 NULL로 둔다(2026-09-07)

  source_lang    text not null default 'ko',
  episode_folder text not null,   -- 채널 원본 폴더명 — 재적재 dedup 키(channel_reports와 동일 관례)

  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(), -- 재push(upsert) 시각 — "언제 갱신됐나" 추적

  -- symbol CHECK — channel_reports(20260905_country_expand.sql)와 완전히 동일한 국가별 분기.
  -- 새로 설계하지 않고 이미 검증된 정규식을 그대로 재사용한다.
  constraint channel_growth_stories_symbol_format check (
    (country = 'KR' and symbol ~ '^[0-9]{5}[0-9A-Z]$')
    or (country = 'US' and symbol ~ '^[A-Z]{1,5}(\.[A-Z])?$')
    or (country not in ('KR', 'US') and symbol ~ '^[A-Za-z0-9.-]{1,10}$')
  )
);

comment on table public.channel_growth_stories is
  '채널(stock-shorts) 성장스토리 적재. 종목당 1행(연 1회 갱신, UPDATE — 새 행 아님). symbol로 종목 페이지 "회사 소개" 섹션에 매달림.';

-- 종목당 1건 원칙 — 채널 재push는 이 키로 UPSERT(ON CONFLICT DO UPDATE)한다.
create unique index if not exists uq_channel_growth_stories_symbol_country on public.channel_growth_stories (symbol, country);

-- 재적재 dedup 2차 키 — episode_folder는 갱신마다 값이 바뀔 수 있다(예: 폴더명에 날짜가
-- 박혀 있는 경우, "20260906_SK하이닉스_성장스토리" → 내년 "20270910_SK하이닉스_성장스토리")
-- — UPDATE로 새 값을 넣는 것이라 유니크 제약과 충돌하지 않는다(같은 폴더명 재push만 막는 용도).
create unique index if not exists uq_channel_growth_stories_episode_folder on public.channel_growth_stories (episode_folder);

-- RLS — channel_reports와 동일 패턴(공개 읽기, 쓰기는 SERVICE_ROLE만).
alter table public.channel_growth_stories enable row level security;
revoke all on public.channel_growth_stories from anon, authenticated;
grant select on public.channel_growth_stories to anon, authenticated;
drop policy if exists "channel_growth_stories public read" on public.channel_growth_stories;
create policy "channel_growth_stories public read" on public.channel_growth_stories for select using (true);
