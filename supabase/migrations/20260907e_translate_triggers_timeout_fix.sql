-- 20260907e_translate_triggers_timeout_fix.sql
-- fire-and-forget 트리거의 pg_net 로그가 거짓말을 하고 있었다 — net.http_post()의
-- timeout_milliseconds 기본값이 5000(5초)인데, 실제 처리(원문 조회 + OpenAI 번역
-- 호출 + 저장)는 6~8초가 걸린다. 트리거는 응답을 기다리지 않는 설계라 동작 자체엔
-- 영향이 없지만(Vercel 함수는 서버에서 계속 실행돼 정상 완료), net._http_response에는
-- **성공이든 실패든 똑같이 "Timeout of 5000 ms reached"**로만 남는다 — 진짜 실패가
-- 나도 이 로그로는 구분이 안 된다(2026-09-07 실측 발견: channel_growth_stories 8건
-- 재발화 테스트에서 8건 다 실제로는 성공(translations 8행 status='ok')했는데
-- net._http_response는 8건 다 timeout으로 찍혀 있었다).
--
-- timeout_milliseconds를 15000(15초)으로 늘린다 — 관측된 실제 처리시간(6~8초)에
-- 여유를 크게 둔 값. channel_growth_stories 쪽만이 아니라 같은 구조인
-- channel_reports 트리거(20260906_channel_reports_translate_trigger.sql)도 같은
-- 문제가 있어 같이 고친다.
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
    body := jsonb_build_object('report_id', NEW.id),
    timeout_milliseconds := 15000
  );
  return NEW;
end;
$$;

create or replace function public.trigger_translate_growth_story()
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
    where name = 'channel_growth_story_translate_secret'
    limit 1;

  perform net.http_post(
    url := 'https://earthticker.app/api/internal/translate-growth-story',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-translate-secret', coalesce(v_secret, '')
    ),
    body := jsonb_build_object('story_id', NEW.id),
    timeout_milliseconds := 15000
  );
  return NEW;
end;
$$;
