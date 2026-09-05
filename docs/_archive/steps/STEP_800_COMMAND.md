# STEP 800 — 🔴 기반 버그 4종 (로케일 쿠키·세션 순서·이전 종목 잔존·로그아웃 누수)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus` 🔴 **Opus 권장**(미들웨어·인증 경계)

**전제 상태**: STEP 799 커밋 이후 HEAD · 트리 클린

**배경**: 전 화면에 걸리는 뿌리 4개. 이걸 안 고치면 이후 렌즈 검증 결과도 신뢰할 수 없다(로그인 상태·데이터가 흔들리므로).

---

## 수정

### 1) 🔴 로케일: 쿠키와 URL이 서로를 덮어씀 (사용자 발견)

**증상**: en→ko 전환 후 종목을 누르면 다시 영어. 지인이 보낸 `/en/...` 링크 한 번 열면 그 뒤로 사이트 전체가 영어. 브라우저를 닫으면 언어 선택이 사라짐.

**원인 3가지**:
- `i18n/routing.ts`에 `localeCookie` 설정이 없어 next-intl 기본값(**max-age 없음 = 세션 쿠키**)이 적용됨.
- 미들웨어가 URL 프리픽스로 판정한 로케일을 **매 요청 쿠키에 다시 씀** → `/en` 방문이 쿠키를 en으로 고정.
- ko는 `as-needed`라 프리픽스가 없어 **쿠키가 지배** → 전환 후 서버 이동에서 쿠키가 이김.

**조치**:
- `localeCookie`에 **max-age 1년** 부여(명시적 선택이 세션마다 휘발하지 않게).
- **언어 전환 시 쿠키를 즉시 갱신**(`Header.tsx`의 `switchLocale`에서 `NEXT_LOCALE`을 직접 set 후 이동). 쿠키와 URL이 같은 값이 되도록.
- 뒤로가기로 옛 `/en` 히스토리를 지날 때 쿠키가 다시 뒤집히는 문제 → **사용자가 명시적으로 고른 언어가 URL 프리픽스보다 우선**하도록 정책을 정하고 구현(예: 전환 시 심는 쿠키에 명시 플래그, 또는 `localeDetection` 정책 조정). **선택한 정책과 근거를 보고에 기재**.
- 🔴 **회귀 금지**: OAuth `redirectTo`는 byte 불변(710D 사망 전례). `post_login_locale`/`post_login_next` 왕복(795)과 충돌하지 않는지 확인.
- 검증 필수 시나리오: ① en→ko 전환 후 종목 클릭 ② ko 상태에서 `/en/stock/005930` 링크 열고 다시 홈으로 ③ 언어 전환 후 브라우저 완전 종료 → 재방문 ④ 로그인 왕복 후 로케일 유지.

### 2) 🔴 `proxy.ts` — Supabase 세션 갱신이 i18n 응답 뒤에 실행됨

**증상**: 탭을 1시간 이상 열어두면 관심 별이 빈 상태·`/api/watchlist` 401 → 새로고침하면 정상. 재현이 어려워 원인 추적이 힘든 유형.

**원인**: `proxy.ts`가 i18n 응답을 **먼저** 만들고(헤더 스냅샷이 그 시점에 고정됨) `getUser()`를 나중에 호출 → 토큰이 갱신되는 그 요청에서 서버 컴포넌트·라우트 핸들러가 **옛 만료 토큰**을 봄.

**조치**: Supabase SSR 공식 패턴 순서로 재배치 — 세션 갱신(쿠키 확정) → i18n 응답 생성 → 갱신된 쿠키를 응답에 반영. i18n 리라이트·`skipsI18n` 예외(`/api`·`/auth/callback`·정적)는 **현행 그대로 보존**.
**검증**: 만료 임박 토큰 상태를 만들어(또는 세션 만료 시간을 짧게 두고) 관심목록 API가 401을 내지 않는지 확인. 로그인/로그아웃 정상 동작 회귀 0.

### 3) 🔴 종목 상세에 이전 종목 데이터가 남음

**증상**: A종목 → B종목 이동 중 `/api/lens`가 실패하면 **B 이름 아래 A의 렌즈 7장·가격**이 그대로 렌더. 금융 데이터 오표시.

**원인**: `StockLensClient.tsx`의 렌즈 fetch에만 cleanup(`alive`/AbortController)이 없고, `.catch`가 `data`를 그대로 둠(바로 아래 events fetch엔 cleanup이 있음).

**조치**: 심볼·로케일 변경 시 (a) 이전 요청 취소/무시 (b) **`data`를 즉시 초기화**해 옛 데이터가 새 종목 화면에 남지 않게 (c) 실패는 기존 `loadError` 경로로. 같은 파일의 다른 fetch들도 cleanup 유무 전수 점검.

### 4) 🔴 로그아웃 후 관심목록 잔존

**증상**: 로그아웃(다른 탭 포함) 후 `/favorites`로 돌아오면 **이전 사용자의 종목 리스트**가 그대로 보임. 공용 PC면 개인정보 노출.

**원인**: `WatchlistClient`가 `useAuthStore`를 구독하지 않고 deps `[]`로 1회만 로드(`ExploreClient`·`TodayClient`는 `user` 변화 시 초기화 — 이 파일만 누락).

**조치**: `user` 변화 구독 → 로그아웃 시 상태 초기화 + 로그인 유도. 로그아웃 시 `explore_recent_searches` 등 개인 흔적 localStorage도 함께 정리(현재 `clearCache` 대상 아님).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **로케일 4시나리오**(위 1번) 전부 실측 — 실제 브라우저에서.
3. **로그인 왕복 회귀**: 실제 구글 로그인으로 ko·en 각 1회(710D 재발 방지).
4. 종목 A→B 연속 이동 시 이전 데이터 잔존 0(네트워크를 끊고 이동해 실패를 강제).
5. 로그아웃 후 `/favorites` — 이전 사용자 데이터 0.
6. 커밋:
   ```bash
   git add app/ components/ lib/ i18n/ proxy.ts docs/STEP_800_COMMAND.md
   git commit -m "STEP 800: locale cookie authority, supabase session order in proxy, stale stock data cleanup, watchlist auth reset"
   git push
   ```

## 완료 보고 → Cowork에게: 로케일 정책 선택 근거 + 4시나리오 실측 + 로그인 회귀 확인 + 커밋 해시. (직후 801.)
