# STEP 760 — 렌즈 '근거 상세' 로그인 게이트 (베타 가입 유도)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `e30d803`(STEP 759) · 트리 클린 · 이메일 가입 개통(758)

**결정(07-18~19 · 장은태)**: 베타 가입 유도 게이트 — **미리보기는 공개, 디테일은 로그인.**
- **공개(비로그인)**: 종목 상세 페이지 자체 + 상단 압축 렌즈 요약(④A 도트·강점/주의/보통) + 렌즈 카드 목록의 **렌즈명·판정 라벨** + '이 종목 브리핑'(AI 요약 — 첫인상 우선 결정) + 뉴스·공시. 보드·검색·도트 전부 공개. **SEO 불변**(서버 HTML·메타 무변).
- **잠금(로그인 필요)**: 렌즈 카드 **펼침(근거 상세 — 왜 그렇게 읽는지·detail 수치·스펙트럼)**. 보드 우측 미리보기의 "TR-AI 렌즈·근거 보기 →" 버튼도 비로그인 시 로그인 유도.

---

## 수정 — 컴포넌트 2곳 + i18n

### 1) `components/stock/StockLensClient.tsx` (또는 렌즈 카드 펼침을 담당하는 실제 컴포넌트 — 코드 확인 후)

- 로그인 상태는 **기존 패턴 재사용**(`authStore` 또는 페이지가 이미 받는 `isLoggedIn` prop — 새 인증 로직 발명 금지).
- 비로그인 사용자가 렌즈 카드를 **펼치려 할 때**: 근거 상세 대신 인라인 게이트 블록 표시 —
  ```
  [자물쇠 아이콘] 근거 상세는 로그인하면 볼 수 있어요
  각 렌즈가 왜 그렇게 읽는지, 수치와 함께 무료로 열립니다.
  [무료 가입·로그인 →]  (버튼: /auth/login?next=<현재 종목 경로>)
  ```
- 카드 접힘 상태(렌즈명+판정 라벨)는 비로그인에도 그대로(미리보기 역할). ETF 뷰(`EtfLensClient`)도 동일 규칙이면 미러, 구조가 다르면 그대로 두고 보고.
- 압축 요약(④A 헤더)·브리핑·뉴스·공시는 **손대지 않음**.

### 2) `components/toolbox/LensPreview.tsx` — "TR-AI 렌즈·근거 보기 →" 버튼

- 비로그인이면 클릭 시 `/auth/login?next=<해당 종목 경로>`로. (라벨은 그대로 — 눌러보게 두고 로그인에서 이유를 알게.)

### 3) 로그인 복귀(`next`) 배선

- `app/[locale]/auth/login/` 이 `?next=` 쿼리를 받아 **이메일 로그인/가입 성공 시** `safeNextPath`(기존 `lib/authRedirect.ts` — 오픈 리다이렉트 가드)로 검증 후 그 경로로 복귀.
- **구글 OAuth의 `redirectTo`는 byte 불변**(절대 규칙 — 710D 로그인 사망 전례). 구글 로그인 복귀는 현행(홈) 유지 — 콜백에 next 전달이 필요하면 **쿠키 방식(`post_login_locale` 전례)**으로만, 이번 STEP에선 이메일 경로만 배선하고 구글은 홈 복귀 유지(베타 v1 허용·보고에 명시).
- i18n: 게이트 문구 ko/en 동시(패리티) — ko 위 문안 기준·en 자연스럽게(멍거 톤·과장 금지).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. 로컬: 로그아웃 상태 — 종목 상세에서 카드 펼침 → 게이트 블록·가입 버튼 → 이메일 로그인 → **원래 종목 페이지 복귀** → 카드 펼침 정상. 로그인 상태 — 게이트 없음(기존과 동일). `/en` 영어 확인. 브리핑·요약·뉴스는 비로그인에도 보임.
3. SEO 가드: 비로그인 서버 HTML(`curl /stock/AAPL`)에 기존 메타·h1 무변 확인.
4. 커밋·푸시:
   ```bash
   git add components/ app/ messages/ docs/STEP_760_COMMAND.md
   git commit -m "STEP 760: login gate on lens detail (preview/briefing stay public), next-path return for email login"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 로컬 게이트 왕복 E2E 결과 · ETF 뷰 처리 여부 · 커밋 해시.
