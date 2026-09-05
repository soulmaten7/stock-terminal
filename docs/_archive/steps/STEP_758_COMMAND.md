# STEP 758 — 이메일+비밀번호 회원가입 (구글 단일 → 이중 로그인)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)

**전제 상태**: 코드 HEAD `887a837`(+docs 커밋들) · 트리 클린

**배경(베타 준비 · 07-18 확정)**: 로그인이 구글뿐 → 이메일+비밀번호 가입 추가(닉네임 포함). **이메일 인증은 베타 기간 OFF**(마찰 최소·R4 대화형 LLM 때 토글 ON — 결정 기록됨). 비밀번호 재설정은 SMTP 필요 → 사용자가 Resend 무료 SMTP를 병렬 세팅(아래 §0 — 코드와 독립·코드가 먼저 나가도 재설정 외 전부 동작).

---

## §0. 사용자(은태님) 액션 — 대시보드 (Claude Code 아님·병렬 진행)

1. **Resend**: resend.com 가입(무료) → Domains에 `onetrillion.app` 추가 → 표시되는 DNS 레코드(SPF·DKIM)를 도메인 DNS에 추가 → 인증 완료 → API Key 발급.
2. **Supabase 대시보드**(Trillion 프로젝트) → Project Settings → Authentication → **SMTP Settings**: Enable Custom SMTP — Host `smtp.resend.com` · Port `465` · Username `resend` · Password = Resend API Key · Sender `noreply@onetrillion.app`(이름 "Trillion").
3. Authentication → Sign In / Providers → **Email 활성 확인** + **"Confirm email" OFF**(베타 결정).

## §1. 코드 — Claude Code

### 1) 가입/로그인 UI — `app/[locale]/auth/login/` (기존 페이지 확장)

- 기존 구글 버튼 유지 + 아래 **탭 2개(로그인 / 회원가입)** 이메일 폼 추가:
  - 로그인: 이메일·비밀번호 → `supabase.auth.signInWithPassword` → 성공 시 기존 복귀 동선(`safeNextPath`·로케일 유지 — OAuth 콜백 안 타므로 클라에서 `router.push`).
  - 회원가입: **닉네임·이메일·비밀번호(최소 8자)** → `supabase.auth.signUp({ email, password, options: { data: { nickname } } })` → 인증 OFF라 즉시 세션 → 동일 복귀.
  - "비밀번호를 잊으셨나요?" 링크 → `resetPasswordForEmail(email, { redirectTo: <사이트>/auth/reset })`.
- **users 테이블 정합**: 기존 OAuth 콜백(`app/auth/callback/route.ts`)의 user insert 로직을 확인하고, 이메일 가입 경로에도 동일 보장(가입 성공 후 서버 라우트로 upsert 또는 콜백 로직과 같은 필드·닉네임 포함). 기존 구글 유저 로직 불변.
- **구글 기가입 이메일 충돌 처리**: signUp이 기존 이메일로 실패하면 에러를 한국어/영어로 — ko "이미 가입된 이메일입니다. 구글 로그인으로 가입하셨다면 구글로 로그인해 주세요." / en 대응.
- i18n: 전 문구 `messages/ko.json`+`en.json` 동시(패리티 테스트). admin 로그인은 불변(구글 유지).

### 2) 재설정 페이지 — 신규 `app/[locale]/auth/reset/`

- 새 비밀번호 입력 → `supabase.auth.updateUser({ password })` → 완료 안내 → 로그인 이동. `force-dynamic`/클라 래퍼 규칙(SYSTEM_MAP §10 캐시 함정) 준수.

### 3) 개인정보처리방침 갱신 — `app/[locale]/privacy/` 본문

- 현행이 "구글 로그인" 기준(07-12 법무 정확화) → 수집 항목에 **이메일 주소·비밀번호(암호화 저장·원문 미보관)·닉네임** 추가, 수집 방법에 "이메일 회원가입" 추가. 구글 문구는 유지. 톤·형식은 기존 조항 스타일 그대로(과장·신설 조항 금지 — 수집 항목 정확화만).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test`(패리티) · `npm run build`
2. 로컬 E2E: 회원가입(닉네임 표시 확인) → 로그아웃 → 이메일 로그인 → 오답 비번 에러 문구 → `/en`에서 가입 흐름 영어 확인 → 구글 로그인 기존 동작 불변
3. (SMTP 세팅 완료 후) 비번 재설정 메일 실수신 → `/auth/reset` 동작 — **은태님 실계정으로 최종 확인**
4. 커밋·푸시:
   ```bash
   git add app/ components/ messages/ docs/STEP_758_COMMAND.md
   git commit -m "STEP 758: email+password signup/login with nickname, password reset, privacy policy update"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · 로컬 E2E 각 항목 결과 · 커밋 해시. (렌즈 근거 게이트는 STEP 759 별도.)
