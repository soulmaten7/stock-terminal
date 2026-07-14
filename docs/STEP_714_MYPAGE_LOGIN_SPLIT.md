<!-- 2026-07-14 -->
# STEP 714 — `'use client'` 페이지 3개 강제 동적화 (mypage·auth/login·admin/login)

**실행:** 🔴 **Opus 권장** — `cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus`
(auth 라우트 민감 + 빌드 결과 판단·폴백 필요. 로그인 로직은 절대 불변.)
**목표:** STEP 713이 못 고친 3개 `'use client'` 페이지를 강제 동적화 → stale 캐시 위험 제거. **로그인·마이페이지 로직은 1글자도 안 건드림.**
**전제:** STEP 713(`9c4d619`). 8/11은 `force-dynamic` 먹혔으나, 이 3개는 `'use client'`라 Next.js가 페이지의 `export const dynamic`을 **무시** → 여전히 정적(`●`).

**대상:** `app/[locale]/mypage/page.tsx` · `app/[locale]/auth/login/page.tsx` · `app/[locale]/admin/login/page.tsx` (전부 `'use client'`).

---

## ✅ 방법 (선택 = 가장 안전) — 얇은 서버 `layout.tsx` 래퍼
`'use client'` 페이지는 자기 파일에서 route 세그먼트 설정을 못 함. 하지만 **부모 `layout.tsx`(서버 컴포넌트)의 `export const dynamic`은 세그먼트 하위로 전파됨.** → 클라이언트 페이지 코드를 **전혀 안 건드리고** 폴더에 layout만 추가.

각 폴더에 **신규 `layout.tsx`** 생성 (3개, 내용 동일):
```tsx
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```
- `app/[locale]/mypage/layout.tsx`
- `app/[locale]/auth/login/layout.tsx`
- `app/[locale]/admin/login/layout.tsx`

그리고 STEP 713이 이 3개 **page.tsx에 넣었던 무효한 `export const dynamic` 줄은 제거**(클라이언트 페이지에선 무시돼 오해만 유발 — 그 한 줄만 삭제, **다른 건 절대 손대지 말 것**). page.tsx의 `'use client'`·로그인 로직·useSearchParams·redirect·OAuth = **전부 그대로.**

## ⚠️ auth 민감 — 절대 규칙
- 로그인/마이페이지의 **본문·상태·useSearchParams·signInWithOAuth·redirect·next 파라미터 = 1글자도 변경 금지.** 이번 작업은 오직 (1) layout 3개 추가 (2) page.tsx의 죽은 dynamic 줄 삭제.
- `redirectTo`·Supabase 허용목록 근처도 가지 말 것(세션 중 로그인 깨진 전례).

## 검증
1. `npm run build` — **3개 라우트가 `ƒ (Dynamic)`로 바뀌었는지 확인**(전엔 `●` 정적). tsc 0·vitest.
2. **만약 layout 래퍼로도 여전히 `●` 정적이면** → 그 페이지만 폴백: page.tsx를 **서버 래퍼로 분리**(현재 `'use client'` 본문을 `XxxClient.tsx`로 이동 + page.tsx는 `export const dynamic="force-dynamic"` 서버 컴포넌트가 `<XxxClient/>` 렌더). useSearchParams는 클라이언트 컴포넌트 안에 그대로. **auth 로직 불변.** (layout 방식이 되면 이 폴백 불필요.)
3. **배포 후 라이브**(캐시버스터 없이):
   - `/auth/login` — 현재 브랜드·i18n(옛 태그라인 없음). **구글 로그인 실제 왕복 성공**(ko·en 둘 다·`?next=` 정상).
   - `/mypage` — 로그인 상태에서 정상 렌더.
   - `/admin/login` — 정상.
4. 홈·보드·종목·about 무영향.

## 커밋
```bash
git add -A && git commit -m "fix: mypage·auth/login·admin/login 강제 동적화 (서버 layout 래퍼·클라 페이지 dynamic 무시 우회·stale 캐시 제거·로그인 로직 불변)" && git push
```

## 참고 (근본·완결)
- 이걸로 **모든 `[locale]` 페이지가 신선**(정적 캐시 stale 0). 캐시 버그 3-STEP(712 종목·713 정적 8개·714 클라 3개) 완결.
- **교훈(플레이북 후보)**: `[locale]` 하위 새 페이지는 캐시 지시자 명시. `'use client'` 페이지는 page.tsx의 `dynamic`이 **무시**되므로 → 서버 `layout.tsx` 또는 서버 래퍼로 설정.
