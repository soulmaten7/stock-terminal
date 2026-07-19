# STEP 762 — 마이페이지 글로벌 표준 재구성 (프로필 / 계정·보안 / 내 활동)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ 순서: STEP 760 → 761 → 762** (같은 인증 흐름 위에 쌓임)

**전제 상태**: STEP 761 커밋 이후 HEAD · 트리 클린

**결정(07-19 · 장은태 · 3중 검색 근거)**: 마이페이지를 글로벌 표준 IA로 — ① 프로필(공개 정체성) / ② 계정·보안(비공개·위험 구역 포함) / ③ 내 활동('내 신고' 최상위 탭 → 여기로 강등·기능 보존). **회원 탈퇴 신설**(GDPR·개보법 + Apple 앱 심사 의무 — Phase 3 앱 출시 대비). 과설계 금지: 알림·테마·이메일 변경 등 없는 기능의 설정칸 만들지 않는다.

---

## 수정 1 — `app/[locale]/mypage/page.tsx` 탭 3개로 재편

- 탭: **profile / account / activity** (기존 2탭 구조·스타일 재사용).

**① profile** — 기존 그대로: 이니셜 아바타 + 닉네임 수정(현행 로직 이동만).

**② account (계정·보안)**
- 이메일 주소 표시(읽기 전용) + 로그인 수단 배지: `supabase.auth.getUser()`의 `app_metadata.providers`로 판별 → "Google" / "이메일" 배지.
- **비밀번호 변경** — providers에 `email` 있을 때만 노출: 새 비밀번호 ×2(일치·8자 이상 검증) → `supabase.auth.updateUser({ password })` → 성공/실패 문구. 구글-only 계정엔 이 블록 대신 "Google 계정으로 로그인 중입니다" 한 줄.
- **위험 구역(맨 아래·구분선)**: "회원 탈퇴" — 클릭 → 확인 UI(빨간 톤·"되돌릴 수 없습니다. 관심종목·활동 기록이 모두 삭제됩니다" + 확인 문구 `탈퇴` 직접 입력) → 아래 수정 2의 API 호출 → 성공 시 `signOut()` + 홈 이동.

**③ activity (내 활동)**
- **관심종목**: `/api/watchlist` GET으로 개수 표시 + "관심종목 보기 →"(`/favorites` 링크).
- **내 신고**: 기존 reports 목록·철회 로직 **그대로 이동**(기능 불변·최상위 탭에서 강등).

## 수정 2 — 신규 `app/api/account/delete/route.ts` (회원 탈퇴)

- POST · 서버에서 세션 검증(`createClient` 서버 → `getUser()` — 비로그인 401). **본인 계정만** 삭제.
- 삭제 순서(admin 클라이언트·SERVICE_ROLE):
  1. `grep`으로 `user_id` 컬럼을 가진 public 테이블 전수 확인 후, 사용자 소유 행 삭제 — 최소: `watchlist`·`room_reports`(신고)·`room_favorites`·`room_likes`·`link_hub_favorites`·`link_hub_clicks`(user_id 있으면)·discussions/댓글류(있으면). `feedback`은 user_id를 null로(피드백 내용은 익명 보존 — 개인정보 아님).
  2. `public.users` 행 삭제.
  3. `supabase.auth.admin.deleteUser(uid)`.
- 에러 시 어느 단계 실패인지 로그(Sentry 캡처) + 500. 성공 `{ok:true}`.

## 수정 3 — i18n (`messages/ko.json`·`en.json` 동시·패리티)

- MyPage 네임스페이스에 탭·계정·보안·탈퇴 문구 추가. 톤 = 건조·정확(멍거) — 탈퇴 경고는 사실만("삭제되며 복구할 수 없습니다").

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 로컬 E2E:
   - 구글 계정: 비밀번호 변경 블록 **숨김**·"Google 계정" 배지·닉네임 수정·내 신고 목록 정상
   - **탈퇴 풀 사이클**: 일회용 이메일로 가입(761 인증 플로우) → 관심종목 1개 추가 → 마이페이지 탈퇴(확인 문구 입력) → 로그아웃·홈 복귀 → **DB 확인**: auth.users·public.users·watchlist에 흔적 0 → 같은 이메일 재가입 가능 확인
   - `/en` 전 문구 영어
3. 커밋·푸시:
   ```bash
   git add app/ components/ messages/ docs/STEP_762_COMMAND.md
   git commit -m "STEP 762: mypage restructure (profile / account+security with deletion / activity), global-standard IA"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · E2E 각 항목(특히 탈퇴 사이클 DB 흔적 0) · user_id 테이블 전수 목록(삭제 대상에 뭘 포함했는지) · 커밋 해시.
