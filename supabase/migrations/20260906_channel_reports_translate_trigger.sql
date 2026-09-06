-- 20260906_channel_reports_translate_trigger.sql
-- 콘텐츠 번역 구현(2026-09-06, 채팅 지시) — "적재 시점 = 번역 시점"(독자 지연 0)을 만족하려면
-- channel_reports에 새 행이 들어오는 즉시(채널이 어떤 클라이언트로 INSERT하든 무관하게) 반응해야
-- 한다. Vercel Hobby 크론은 하루 1회 한도(.claude/rules/deploy-gates.md §4)라 "즉시"를 못 만족하고,
-- 이 저장소는 상시 실행 서버가 없는 서버리스(Vercel)라 앱 프로세스가 DB 변경을 계속 구독하고
-- 있을 수도 없다 — 그래서 DB 레벨 AFTER INSERT 트리거 + pg_net(비동기 HTTP, Supabase 표준 확장)로
-- stock-terminal 자신의 API 라우트를 호출하는 방식을 쓴다(Supabase "Database Webhooks" 기능과
-- 동일한 원리, 대시보드 대신 SQL로 직접 구성). INSERT 트랜잭션은 pg_net 호출을 기다리지 않고
-- 즉시 끝난다(비동기) — 번역 서비스가 느리거나 실패해도 리포트 적재 자체는 절대 막히지 않는다.
--
-- 인증: 비밀 값을 이 마이그레이션 파일(git 커밋 대상)에 평문으로 넣지 않는다 — 별도 실행한
-- vault.create_secret('...', 'channel_report_translate_secret')로 Vault에만 저장해뒀고, 트리거
-- 함수는 이름으로만 참조한다. 같은 값은 Vercel 프로덕션 env(CHANNEL_REPORT_TRANSLATE_SECRET)에도
-- 심어져 있다 — API 라우트가 헤더 값과 대조해 본인 호출인지 검증한다.
-- 적용: 2026-09-06 라이브 반영(ccbwxcszdoyjxvckedfp, MCP apply_migration).
create extension if not exists pg_net;

create or replace function public.trigger_translate_channel_report()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
    from vault.decrypted_secrets
    where name = 'channel_report_translate_secret'
    limit 1;

  perform net.http_post(
    url := 'https://earthticker.app/api/internal/translate-channel-report',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-translate-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object('report_id', NEW.id)
  );
  return NEW;
end;
$$;

comment on function public.trigger_translate_channel_report() is
  'channel_reports AFTER INSERT 트리거 본체 — pg_net으로 /api/internal/translate-channel-report를 비동기 호출(응답을 기다리지 않음).';

drop trigger if exists channel_reports_translate_after_insert on public.channel_reports;
create trigger channel_reports_translate_after_insert
  after insert on public.channel_reports
  for each row execute function public.trigger_translate_channel_report();
