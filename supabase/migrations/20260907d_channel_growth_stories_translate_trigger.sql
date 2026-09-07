-- 20260907d_channel_growth_stories_translate_trigger.sql
-- channel_reports_translate_after_insert(20260906)와 완전히 같은 원리 — AFTER 트리거 +
-- pg_net(비동기 HTTP)로 stock-terminal 자신의 내부 API 라우트를 호출한다.
--
-- 🔴 channel_reports와 다른 지점: 그 트리거는 AFTER INSERT만 본다(리포트 행은 불변 — 매번
-- 새 리포트=새 행). channel_growth_stories는 종목당 1행을 UPDATE로 갱신하므로(재제작 시)
-- **AFTER INSERT OR UPDATE** 둘 다 잡아야 번역이 낡은 채로 안 남는다.
--
-- 인증: 비밀 값을 이 마이그레이션 파일(git 커밋 대상)에 평문으로 넣지 않는다 — 별도 실행한
-- vault.create_secret('...', 'channel_growth_story_translate_secret')로 Vault에만 저장했고,
-- 트리거 함수는 이름으로만 참조한다. 같은 값을 Vercel 프로덕션 env
-- (CHANNEL_GROWTH_STORY_TRANSLATE_SECRET)에도 심어야 한다 — 장은태가 직접(Claude Code는
-- Vercel 환경변수 설정 권한이 없음).
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
    body := jsonb_build_object('story_id', NEW.id)
  );
  return NEW;
end;
$$;

comment on function public.trigger_translate_growth_story() is
  'channel_growth_stories AFTER INSERT OR UPDATE 트리거 본체 — pg_net으로 /api/internal/translate-growth-story를 비동기 호출(응답을 기다리지 않음).';

drop trigger if exists channel_growth_stories_translate_after_change on public.channel_growth_stories;
create trigger channel_growth_stories_translate_after_change
  after insert or update on public.channel_growth_stories
  for each row execute function public.trigger_translate_growth_story();
