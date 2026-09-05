-- 20260905_country_expand.sql
-- ORDER_트릴리언국가확장구조_0905 STEP2 — 국가 확장 구조 전환에 필요한 DB 변경.
-- 적용: 2026-09-05 라이브 반영(ccbwxcszdoyjxvckedfp, MCP apply_migration).

-- 1) channel_reports.title — 영상 제목/리포트 대표 소제목(채널이 채워 보냄, Trillion 생성 금지).
--    NULL 허용 — 기존 15건은 NULL로 남고(억지로 채우지 않음), 채널이 재push하면 채워진다.
alter table public.channel_reports add column if not exists title text;
comment on column public.channel_reports.title is
  '영상 제목 또는 리포트 대표 소제목 — 채널이 채워 보냄, Trillion 생성 금지. NULL 허용(기존 15건 NULL).';

-- 2) symbol CHECK를 country별로 분기(사용자 확정, 2026-09-05) — 완전히 풀지 않는다.
--    KR: 기존 6자리(+우선주 접미대문자 1글자) 그대로. US: 알파벳 1~5자(+선택적 클래스 접미사, 예 BRK.B).
--    그 외 국가(아직 없음, 향후 JP 등): 문자·숫자·점·하이픈 1~10자의 일반적인 티커 모양만 허용 —
--    "완전 오픈"은 피하되(오적재 방지), 아직 형식을 모르는 나라는 최소한의 상식적 형태만 강제한다.
--    실제 새 국가가 붙으면 그 나라 전용 분기를 추가하는 게 정답 — 이 catch-all은 임시 안전망이다.
alter table public.channel_reports drop constraint if exists channel_reports_symbol_format;
alter table public.channel_reports add constraint channel_reports_symbol_format check (
  symbol is null
  or (country = 'KR' and symbol ~ '^[0-9]{5}[0-9A-Z]$')
  or (country = 'US' and symbol ~ '^[A-Z]{1,5}(\.[A-Z])?$')
  or (country not in ('KR', 'US') and symbol ~ '^[A-Za-z0-9.-]{1,10}$')
);

-- 3) our_channels.country_code — channel_key(채널 슬러그)와 국가를 분리(한 국가에 채널이 둘 이상
--    생길 여지 대비, ORDER_트릴리언국가확장구조_0905 §2 판단). 기존 2행은 channel_key를 그대로
--    대문자화해 백필(kr→KR, us→US) — 지금은 값이 같지만 개념은 분리됐다.
alter table public.our_channels add column if not exists country_code text;
update public.our_channels set country_code = upper(channel_key) where country_code is null;
alter table public.our_channels alter column country_code set not null;

-- channel_key를 'kr'/'us' enum으로 막던 CHECK 제거 — 채널 슬러그는 이제 국가와 무관하게 자유
-- 형식(향후 "kr-stockscouter" 같은 이름도 가능). 대신 country_code에 최소 형식(대문자 2자)만 건다 —
-- 국가 목록 자체는 lib/constants/reportCountries.ts(코드)가 정본이라 DB에 enum을 박지 않는다.
alter table public.our_channels drop constraint if exists our_channels_channel_key_check;
alter table public.our_channels add constraint our_channels_country_code_format check (country_code ~ '^[A-Z]{2}$');
