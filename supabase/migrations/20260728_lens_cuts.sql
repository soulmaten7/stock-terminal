-- 판정 컷 = 시장별 분포에서 유도(STEP 802 §1). 렌즈 선계산 크론이 유니버스 전체 값의 하위30%/상위30%(3분위)를
-- 컷으로 저장. 하드코딩 상수(모든 시장 동일) 대신 시장별 분포로 → KR 중위 PER이 US 상수(10/25)로 "싸다" 오판되던 것 방지.
-- RSI(30/70)·F-Score(3/7)는 학술·업계 표준 고정값이라 이 테이블 대상에서 제외(코드에서 상수 유지).
-- 이번 STEP은 컷을 '저장'만(유도·아카이브). 렌즈 '소비부'(상수→이 테이블 읽어 판정)는 후속 STEP.
create table if not exists lens_cuts (
  market text not null,
  lens_key text not null,
  lo double precision,      -- 하위 30% 백분위 값
  hi double precision,      -- 상위 70% 백분위 값
  n integer not null,       -- 표본 수(유니버스 중 값이 있는 종목)
  as_of timestamptz not null default now(),
  method text not null,     -- 예: 'p30/p70'
  primary key (market, lens_key)
);

alter table lens_cuts enable row level security;
-- 읽기·쓰기 전부 service-role(크론·서버) — anon/authenticated 권한 없음(공개 데이터 테이블 관례와 동일).
revoke all on lens_cuts from anon, authenticated;
