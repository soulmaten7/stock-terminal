-- 크론 하트비트(STEP 794 §4) — email-brief·jp-disclosures처럼 "결과 테이블 나이"로는 실행 여부를
-- 알 수 없는 크론(구독자 0·조용한 주말이면 산출물이 안 갱신돼 오탐)의 '실행 시각'을 job별 1행으로 기록.
-- 헬스체크가 last_run_at 나이를 감시 → 조용히 죽으면 검출. 크론이 매 실행 끝에 upsert(best-effort·비치명).
create table if not exists cron_heartbeats (
  job text primary key,
  last_run_at timestamptz not null default now(),
  ok boolean not null default true,
  note text
);

alter table cron_heartbeats enable row level security;
-- 읽기·쓰기 전부 service-role(크론·헬스체크)만 — anon/authenticated 권한 없음(공개 데이터 테이블 관례와 동일).
revoke all on cron_heartbeats from anon, authenticated;
