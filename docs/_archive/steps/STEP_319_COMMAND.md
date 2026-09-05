<!-- 2026-06-20 -->
# STEP 319 — [긴급 버그픽스] 로그인 상태 안 뜨는 문제 (onAuthStateChange 데드락)

> ⚠️ **이 수정은 이미 Cowork가 디스크에 적용 + HMR로 검증 완료.** 이 STEP은 **기록 + 커밋용**이야. 코드 다시 안 짜도 되고, 아래 커밋 명령만 실행하면 돼.

## 🐞 증상
로그인은 됐는데(서버·쿠키·세션·DB 전부 정상) 화면은 계속 **로그아웃 상태** → 헤더 아바타 안 뜨고, 마이페이지·관리자 접근 불가.

## 🔬 근본 원인 (브라우저 런타임 추적으로 확정)
- 서버 인증 ✅, 쿠키(`sb-...-auth-token.0/.1`) ✅, `getSession()`·users 조회 ✅ (모두 직접 실행해 확인)
- 그런데 앱의 `AuthProvider`에서 **`await supabase.auth.getSession()`이 영원히 resolve 안 됨**(멈춤).
- 범인: **`onAuthStateChange` 콜백 안에서 `await supabase.from('users')...` 호출** → supabase auth **락 데드락**. 콜백이 락을 쥔 채 또 다른 supabase 호출(락 필요)을 기다려서 전체가 멈춤.
- **왜 이제야?** 세션 쿠키가 청크(.0/.1)로 커지면서 초기화 중 락 점유 시간이 길어져 데드락 창이 열림. (STEP 300 땐 세션이 작아 안 터짐)

## 🔧 수정 (`components/auth/AuthProvider.tsx` — 이미 적용됨)
- `onAuthStateChange` 콜백을 **동기 함수**로 변경 (async 제거)
- 콜백 안의 DB 조회를 **`setTimeout(…, 0)`으로 콜백 밖**(락 해제 후)에서 실행
- 공통 `fetchProfile(userId)` 헬퍼로 정리

## ✅ 검증 (Cowork가 브라우저에서 직접 확인)
- `/rest/v1/users` 호출 정상 발생 · `hasLoginLink: false` · 헤더에 **프로필 아바타(S)** 표시 → 로그인 상태 정상 반영.

## 📦 커밋·푸시 (이것만 실행)
```bash
cd ~/stock-terminal && git add components/auth/AuthProvider.tsx && git commit -m "fix(auth): onAuthStateChange 콜백 데드락 해소 — 콜백 동기화 + DB조회 setTimeout 분리 (getSession 멈춤 → 로그인 정상 반영) (STEP 319)" && git push
```

## 🧠 교훈 (재발 방지)
**`onAuthStateChange` 콜백 안에서는 절대 `await supabase.*` 호출하지 말 것.** 필요하면 `setTimeout(…, 0)`으로 콜백 밖에서 실행.
