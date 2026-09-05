<!-- 2026-06-20 -->
# STEP 297 — [V7 ⑤] 구글 로그인 버튼 추가

## ⚠️ 먼저 — 대시보드 설정 (이거 안 하면 버튼 눌러도 에러)

### A. 구글 클라우드 (OAuth 자격증명)
1. https://console.cloud.google.com → 프로젝트 선택 (유튜브 키 만든 그 프로젝트 재사용 가능)
2. **API 및 서비스 → OAuth 동의 화면** → 외부(External) → 앱 이름·지원 이메일 입력 → 저장.
   (테스트 모드면 "테스트 사용자"에 **본인 이메일 추가**, 또는 앱 "게시")
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
4. 애플리케이션 유형 = **웹 애플리케이션**
5. **승인된 리디렉션 URI**에 정확히 추가:
   ```
   https://qxkmwlkchyxfzxbonhtj.supabase.co/auth/v1/callback
   ```
6. 만들기 → **클라이언트 ID** + **클라이언트 보안 비밀(Secret)** 복사

### B. Supabase (Provider 활성화)
1. https://supabase.com → 운종 프로젝트 → **Authentication → Providers → Google**
2. **Enable** 켜고, 위 **Client ID / Client Secret** 붙여넣기 → 저장

> A·B 끝나면 아래 STEP 실행. (키 값은 채팅에 붙여넣지 말 것 — Supabase 대시보드에만.)

---

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음 터미널에:
```
@docs/STEP_297_COMMAND.md 파일 내용대로 실행해줘
```

- **전제 상태(HEAD)**: STEP 296(`68577ec`). 빌드 ✓.

---

## 🎯 목표

`/auth/login`에 **"Google로 시작하기"** 버튼 추가 (기존 카카오 버튼 밑). 카카오와 동일한 `signInWithOAuth` 패턴.

---

## 📄 `app/auth/login/page.tsx`

### (1) 구글 핸들러 추가 — 카카오 핸들러 바로 밑
**찾기:**
```tsx
  const handleKakaoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };
```
**바꾸기:**
```tsx
  const handleKakaoLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(false);
    }
  };
```

### (2) 구글 버튼 추가 — 카카오 버튼 바로 밑
**찾기:**
```tsx
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#FEE500] text-[#000] font-semibold py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <MessageCircle size={18} />
            {loading ? "이동 중..." : "카카오로 시작하기"}
          </button>
```
**바꾸기:**
```tsx
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-[#FEE500] text-[#000] font-semibold py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <MessageCircle size={18} />
            {loading ? "이동 중..." : "카카오로 시작하기"}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-white text-[#1f1f1f] font-semibold py-3 border border-unjong-border hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
            </svg>
            {loading ? "이동 중..." : "Google로 시작하기"}
          </button>
```

---

## ✅ 검증

```bash
npm run build
```
- 빌드 무에러.

개발 서버(`npm run dev`, 포트 3333):
1. `/auth/login` → 카카오 버튼 밑에 **"Google로 시작하기"**(구글 G 로고).
2. 클릭 → 구글 로그인 화면 → 동의 → 홈으로 돌아오며 로그인됨.
   - (에러 나면 대부분 A·B 대시보드 설정 누락 — 리디렉션 URI 오타 확인)

---

## 📦 커밋·푸시

```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(v7): 구글 OAuth 로그인 버튼 추가 (/auth/login) (V7 ⑤, STEP 297)" && git push
```

---

> **한 줄 요약**: /auth/login에 구글 로그인 버튼 추가(카카오와 동일 패턴). 전제 = 구글 클라우드 OAuth 자격증명 + Supabase Google Provider 활성화(대시보드).
