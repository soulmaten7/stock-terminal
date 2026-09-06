-- 20260906_channel_report_translations.sql
-- 콘텐츠 번역 구현(2026-09-06, 채팅 지시) — channel_reports.stock_name/broker는 번역하지 않고
-- kr_stock_snapshot.name_en 조회(+비상장 증권사 소규모 용어집)로 대체(앱 코드에서 처리), verdict는
-- UI 고정 사전 매핑(이미 구현됨, components/reports/ReportRow.tsx VERDICT_LABEL)으로 처리한다.
-- 여기서 번역해 저장하는 건 자유서술 필드(title·reasons[].title/detail·earnings_summary)뿐이다.
--
-- 🔴 20260905_channel_reports.sql 코멘트의 "번역 표시는 이후 STEP(translation_cache 재사용)" 계획을
-- 뒤집는다 — translation_cache(PK: target_lang+src_text)는 이미 다른 기능(US 뉴스 헤드라인, 구글번역
-- 무료 엔드포인트, app/api/news/feed/route.ts)이 쓰고 있고, 그 엔드포인트는 프롬프트 지시를 못 받아
-- 고유명사 보존이 불가능하다(조사 결론). 언어가 늘어나도(일본·영국 등) 스키마 변경 없이 대응하려고
-- 리포트별 _en/_ko 컬럼 대신 이 별도 테이블(report_id, target_lang 조합 키) 방식을 쓴다.
-- 적용: 2026-09-06 라이브 반영(ccbwxcszdoyjxvckedfp, MCP apply_migration).
create table if not exists public.channel_report_translations (
  report_id        bigint not null references public.channel_reports(id) on delete cascade,
  target_lang      text not null,                    -- 'en' | 'ko' (추후 'ja' 등 확장 가능 — 스키마 변경 없음)
  title            text,
  reasons          jsonb,                             -- [{title, detail}] — 원본 reasons와 같은 모양
  earnings_summary text,
  status           text not null default 'ok',        -- 'ok' | 'failed' — 실패해도 행은 남기고 원문 폴백(앱 코드가 처리)
  error            text,                               -- status='failed'일 때 사유(디버깅용)
  model            text,                               -- 'gpt-4o-mini' 등 — 모델 교체 이력 추적용
  translated_at    timestamptz not null default now(),
  primary key (report_id, target_lang)
);

comment on table public.channel_report_translations is
  'channel_reports 자유서술 필드(title·reasons·earnings_summary)의 언어별 번역 캐시. stock_name/broker/verdict는 여기 없음(각각 name_en 조회·고정사전으로 별도 처리, 위 코멘트 참조).';

create index if not exists idx_channel_report_translations_lang on public.channel_report_translations (target_lang);

-- RLS — 20260905_channel_reports.sql과 동일 패턴(공개 읽기, 쓰기는 SERVICE_ROLE만).
alter table public.channel_report_translations enable row level security;
revoke all on public.channel_report_translations from anon, authenticated;
grant select on public.channel_report_translations to anon, authenticated;
drop policy if exists "channel_report_translations public read" on public.channel_report_translations;
create policy "channel_report_translations public read" on public.channel_report_translations for select using (true);
