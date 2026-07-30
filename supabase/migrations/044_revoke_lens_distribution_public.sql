-- STEP 835 §5: lens_distribution PUBLIC EXECUTE revoke — 833 §4가 anon/authenticated만 걷어 PUBLIC 기본 grant가 남았다.
-- 실측 노출은 없으나(호출자 권한 함수 + lens_cuts/lens_scores 테이블 revoke로 anon 실행 시 permission denied) 의도-코드 일치화.
-- (2026-07-30 MCP apply_migration으로 라이브 적용 완료 — 이 파일은 리포 기록/재현용.)
revoke execute on function lens_distribution(text, text) from public;
