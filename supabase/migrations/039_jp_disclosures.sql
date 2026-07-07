-- JP 공시(EDINET) 미리계산 테이블. US EDGAR·KR DART의 JP 짝.
-- EDINET documents.json은 '날짜별' 조회만 되고 회사 필터가 없어 → 크론이 매일 긁어 여기 저장 → 종목 페이지는 sec_code로 즉시 조회.
create table if not exists public.jp_disclosures (
  doc_id text primary key,             -- EDINET docID (원문 다운·요약 캐시 키)
  sec_code text not null,              -- 5자리 증권코드 (예: 72030 = 7203 도요타)
  doc_type_code text,                  -- 120=有報·140=四半期·160=半期·臨時報告書 등
  doc_description text,                 -- 서류 제목(일본어)
  submit_datetime timestamptz,
  current_report_reason text,          -- 臨時報告書(중대사건) 사유 — non-null이면 중대공시
  updated_at timestamptz default now()
);
create index if not exists jp_disclosures_sec_idx on public.jp_disclosures (sec_code, submit_datetime desc);
alter table public.jp_disclosures enable row level security;
drop policy if exists jp_disclosures_read on public.jp_disclosures;
create policy jp_disclosures_read on public.jp_disclosures for select using (true);
