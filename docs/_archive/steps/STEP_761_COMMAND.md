# STEP 761 — 이메일 인증(링크 방식) UX 폴리시 (Confirm email ON 정식 대응 · A안 확정)

**실행**: `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet` (Sonnet)
**⚠️ STEP 760(렌즈 게이트) 완료 후 실행** (같은 로그인 페이지·순차)

**전제 상태**: STEP 760 커밋 이후 HEAD · 트리 클린 · Supabase "Confirm email" **ON** · Resend SMTP 가동

**결정(07-19 · 장은태 · A안)**: 인증 = **링크 클릭 방식**(서버 기본 동작 그대로 — 템플릿 구조 변경 불필요·코드 최소). 가입 → "확인 메일을 보냈어요" 안내 → 메일 링크 클릭 → 인증+로그인 완료 복귀. (OTP 코드 입력안은 폐기 — 이 파일이 코드안을 대체.)

---

## §0. 사용자(은태님) 액션 — 선택 1개 (권장·품질)

Supabase → Authentication → Emails → **Confirm signup** 템플릿의 문안만 한국어/브랜드로 (링크 구조 `{{ .ConfirmationURL }}`는 그대로 유지):
- 제목: `Trillion 이메일 인증`
- 본문 예시:
  ```html
  <h2>Trillion 이메일 인증</h2>
  <p>아래 버튼을 누르면 가입이 완료됩니다.</p>
  <p><a href="{{ .ConfirmationURL }}">이메일 인증하기</a></p>
  <p>본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
  ```
(기본 영문 템플릿 그대로여도 동작엔 문제없음 — 첫인상 품질용.)

## §1. 코드 — Claude Code

### 1) 가입 → 안내 화면 (`app/[locale]/auth/login/` 회원가입 탭)

- `signUp(...)` 호출 시 **`options.emailRedirectTo`를 기존 OAuth 콜백**으로: `${location.origin}/auth/callback` — ⚠️ **Supabase 리다이렉트 허용목록에 이미 있는 경로 재사용**(새 URL 추가 금지·710D 전례). 로케일 복귀는 **기존 `post_login_locale` 쿠키 메커니즘 재사용**(구글 로그인과 동일하게 signUp 직전 세팅) — 콜백이 이미 처리함.
- 가입 성공(세션 없음) → 폼 대신 **안내 화면**:
  ```
  [메일 아이콘] {email}로 확인 메일을 보냈어요
  메일함에서 "이메일 인증하기"를 누르면 가입이 완료됩니다.
  (스팸함도 확인해 주세요)
  [확인 메일 재발송]  (60초 쿨다운 — 서버 최소 간격과 정합)
  ```
- 재발송: `supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: 동일 } })`.
- 758의 임시 방어 문구(`signupNeedsConfirm`)는 이 정식 화면으로 대체·제거.

### 2) 링크 클릭 후 동선

- 링크 → Supabase가 인증 처리 → `/auth/callback` 복귀 → **기존 콜백 로직**(세션 교환·users insert·로케일 쿠키)이 그대로 처리 → 로그인 상태로 홈 복귀. **콜백 코드가 이메일 인증 플로우에서도 정상 동작하는지 확인**(OAuth 전용 가정이 있으면 보완·구글 경로 byte 불변).

### 3) 미인증 로그인 시도

- "Email not confirmed" 에러 → 문구: "이메일 인증이 아직 안 됐어요. 메일함의 인증 링크를 눌러주세요." + [확인 메일 재발송] 버튼.

### 4) i18n

- 전 문구 ko/en 동시(패리티 테스트 통과 필수).

## 검증

1. `npx tsc --noEmit` 0 · `npm run test` · `npm run build`
2. **라이브 E2E**(배포 후·실이메일): 가입 → 안내 화면 → 메일 수신(Resend Emails 탭 기록) → 링크 클릭 → **로그인 상태로 복귀·users 행 생성** → 로그아웃 → 이메일 로그인 정상. 미인증 상태 로그인 에러 문구·재발송 쿨다운. `/en` 영어. 구글 로그인 불변.
3. 커밋·푸시:
   ```bash
   git add app/ components/ messages/ docs/STEP_761_COMMAND.md
   git commit -m "STEP 761: email confirmation link flow UX (sent-mail screen, resend, callback reuse)"
   git push
   ```

## 완료 보고 → Cowork에게
- tsc/vitest/build · E2E 결과(메일 수신·링크 복귀는 사용자와 함께) · 커밋 해시.
