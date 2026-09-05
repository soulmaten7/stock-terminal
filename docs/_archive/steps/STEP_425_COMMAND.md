<!-- 2026-06-27 -->
# STEP 425 — 로그인: 카카오 버튼 제거 (구글만, 깨진 버튼 정리)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_425_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
카카오 로그인은 Supabase에 provider가 비활성이라 **'카카오로 시작하기' 버튼이 에러**(`provider is not enabled`)를 낸다. 지금은 카카오를 안 켜기로 결정(구글로 충분, 로그인 전환은 Phase 3~5에서 중요해질 때 재추가). → **깨진 카카오 버튼을 제거하고 구글 로그인만 남긴다.**

## 전제
- 최신 main(STEP 424 이후). **`app/auth/login/page.tsx` 1파일만**. 클라이언트 컴포넌트 → HMR.
- 빌드 위험 0(버튼·핸들러·미사용 import 제거) → 끝에 **로컬 커밋만**(빌드·푸시 X).
- 카카오 관련 env(`KAKAO_*`)는 그대로 둠(무해, 나중 재추가용).

---

## `app/auth/login/page.tsx` — 3곳 수정

### (1) 미사용될 `MessageCircle` import 제거
**찾기:**
```tsx
import { MessageCircle, ArrowLeft } from "lucide-react";
```
**바꾸기:**
```tsx
import { ArrowLeft } from "lucide-react";
```

### (2) `handleKakaoLogin` 함수 제거
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

  const handleGoogleLogin = async () => {
```
**바꾸기:**
```tsx
  const handleGoogleLogin = async () => {
```

### (3) 카카오 버튼 JSX 제거 (구글 버튼만 남김)
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

          <button
            type="button"
            onClick={handleGoogleLogin}
```
**바꾸기:**
```tsx
          <button
            type="button"
            onClick={handleGoogleLogin}
```

---

## 커밋 (빌드·푸시 X)
```bash
git add app/auth/login/page.tsx docs/STEP_425_COMMAND.md
git commit -m "chore(STEP 425): 로그인 카카오 버튼 제거(provider 미활성 깨진 버튼) — 구글만, 추후 재추가"
```

## 확인
- `/auth/login` — **구글 버튼만** 표시, 카카오 버튼 없음.
- 구글 로그인 정상 동작(기존 그대로).
- 콘솔/빌드 에러 없음(미사용 `MessageCircle`·`handleKakaoLogin` 제거됨).

## 메모 (나중 재추가)
- 카카오는 **Phase 3(알림)·Phase 5(AI 구독)** 등 로그인 전환이 중요해질 때 재추가. 한국 유저는 카카오 선호 → 그때 가치 큼. 재추가 = 버튼 + `signInWithOAuth({provider:'kakao'})` + Supabase Kakao provider 활성화.
