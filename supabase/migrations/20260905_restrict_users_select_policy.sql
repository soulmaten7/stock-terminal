-- ORDER 트릴리언보안정리_0905: "users public read"(SELECT USING (true))가 anon 키로 email 등
-- 전체 사용자 정보를 공개 조회 가능하게 열어두고 있었다. 의존 코드 전수 확인 결과 없음(전부
-- auth.uid() 본인 행 조회, 커뮤니티/타인 프로필 열람 기능 자체가 없음) — 본인 행만 허용하는
-- "Users can view own profile"/"users self update" 등 uid 스코프 정책은 이미 별도로 존재하므로
-- 이 넓은 정책만 제거한다.
drop policy if exists "users public read" on public.users;
