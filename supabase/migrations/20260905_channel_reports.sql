-- 20260905_channel_reports.sql
-- ORDER_트릴리언리포트테이블_0905 STEP2 적용 — 채널(stock-shorts/otpage1)이 만든 종목 리포트를
-- 종목코드로 매달아 시간순으로 쌓는 테이블. otpage1의 landing.json 필드를 그대로 옮기고
-- symbol·country·source_lang·episode_folder를 얹었다.
-- 표시: `WHERE symbol = X ORDER BY report_date DESC` (최신이 위).
-- 적용: 2026-09-05 라이브 반영(ccbwxcszdoyjxvckedfp, MCP apply_migration) — 실측 검증 완료
-- (컬럼 18개·RLS on·anon/authenticated=SELECT만·정책 1개·인덱스 4개, 아래 STEP2 완료보고 참조).

create table if not exists public.channel_reports (
  id               bigint generated always as identity primary key,

  -- 종목 식별 — 채널이 코드를 직접 보낸다(이름→코드 역조회는 만들지 않음, 조사 결과: 역조회 함수 부재·
  -- name UNIQUE 제약 없음·사명변경 리스크). 코드가 없거나 형식이 안 맞으면 NULL로 받아 격리한다(아래 참조).
  symbol           text,
  stock_name       text not null,                 -- landing.json stockName — 코드 매칭 실패해도 원문 이름은 보존
  country          text not null default 'KR',     -- 확장 대비 컬럼. 지금은 KR만 채움(US는 이후 STEP)

  -- 리포트 본문 — landing.json 그대로(가격은 서술형 문자열 그대로 옮김. 숫자 파싱은 나중 과제)
  report_date      date not null,                  -- landing.json reportDate(증권사 리포트 발행일) — 정렬 기준
  assembled_date   date,                            -- landing.json date(채널 편 조립일). 발행일과 다를 수 있음
  broker           text not null,
  verdict          text,                            -- 상향 | 유지 | 하향 (Episode 타입상 optional)
  target_price     text,
  current_price    text,
  upside           text,
  reasons          jsonb not null default '[]'::jsonb, -- [{title, detail}]
  earnings_summary text,
  broker_average   text,                            -- landing.json brokerAverage(옵셔널 필드 — 현재 0/15 실사용이나 타입엔 있음)

  -- 출처·번역·원본 추적
  source_lang      text not null default 'ko',      -- 원문 언어. 번역 표시는 이후 STEP(translation_cache 재사용)
  episode_folder   text not null,                   -- 채널 원본 폴더명(예: "20260904_팬오션") — 재적재 dedup 키

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(), -- 재push(upsert) 시각 추적용 — ORDER 최소목록엔 없던 추가 제안(아래 보고 참조)

  -- 코드 오입력 방어(느슨한 검증) — kr_stock_snapshot 실측 포맷(6자리, 우선주 등은 끝자리 대문자 1글자·예 "00499K")과
  -- 대조한 형식 체크만. 존재 여부(FK)까지는 강제하지 않는다 — 채널 파이프라인이 막히면 안 되므로(보고 §6 참조).
  -- 🔴 이 정규식은 KR 전용이다 — US 티커(알파벳 1~5자, 숫자 없음)는 이 CHECK를 통과 못 하고 거부된다.
  --    US 확장 STEP에서 country별로 분기하는 CHECK(또는 도메인/트리거)로 다시 설계해야 한다. 지금은 country='KR' 고정이라
  --    안전하지만, US 도입 시 이 제약을 안 바꾸고 US 심볼을 넣으면 전부 INSERT 실패한다 — 미리 남겨두는 경고.
  constraint channel_reports_symbol_format check (symbol is null or symbol ~ '^[0-9]{5}[0-9A-Z]$')
);

comment on table public.channel_reports is '채널(stock-shorts/otpage1) 종목 리포트 적재. symbol로 종목 페이지에 매달림.';

-- 재적재 dedup — 채널 원본 단위(episode_folder)가 1차 키. 같은 폴더를 두 번 push해도 새 행이 안 생기게 upsert 대상으로 쓴다.
create unique index if not exists uq_channel_reports_episode_folder on public.channel_reports (episode_folder);

-- 방어적 2차 유니크(선택, 2026-09-05 사용자 판정: 켜지 않음) — episode_folder가 서로 달라도 같은
-- (종목·발행일·증권사) 조합이면 의미상 같은 리포트일 가능성이 있다는 신호이지만, 같은 종목·같은 날·같은 증권사가
-- 두 번 리포트를 내는 것도 정당한 케이스로 허용하기로 했다(실제로 있을 수 있는 정상 상황을 막지 않는다).
-- 켜려면 이 줄 주석을 풀되, ON CONFLICT 대상은 episode_folder 하나만 유지할 것(둘 다 켜면 정상 재push가 이 제약에
-- 걸려 에러날 수 있음 — 보고 §3 트레이드오프 참조).
-- create unique index if not exists uq_channel_reports_symbol_date_broker on public.channel_reports (symbol, report_date, broker) where symbol is not null;

-- 종목 페이지 조회 — symbol로 필터 + report_date 내림차순(정확히 이 STEP의 표시 쿼리와 일치).
create index if not exists idx_channel_reports_symbol_date on public.channel_reports (symbol, report_date desc);

-- 미매칭 리포트 검토 큐 — symbol이 NULL인 행만(코드 없이/잘못 온 리포트). 별도 status 컬럼 없이 NULL 자체를 상태로 씀(보고 §6).
create index if not exists idx_channel_reports_unmatched on public.channel_reports (created_at desc) where symbol is null;

-- RLS — 기존 "공개 읽기" 패턴(028_lens_scores.sql·001_initial_schema.sql의 link_hub)을 따르되,
-- 그 테이블들이 갖고 있던 알려진 구멍(TRUNCATE는 RLS로 안 막힘 — 20260712_enable_rls_public_data_tables.sql 주석)을
-- 이번엔 처음부터 REVOKE로 같이 막는다. 쓰기(INSERT/UPDATE)는 채널이 SERVICE_ROLE_KEY로 한다(RLS 우회).
alter table public.channel_reports enable row level security;
revoke all on public.channel_reports from anon, authenticated;
grant select on public.channel_reports to anon, authenticated;
drop policy if exists "channel_reports public read" on public.channel_reports;
create policy "channel_reports public read" on public.channel_reports for select using (true);
