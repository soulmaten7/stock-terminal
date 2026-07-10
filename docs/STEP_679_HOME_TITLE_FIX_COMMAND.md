<!-- 2026-07-10 -->
# STEP 679 — 🏷️ 홈 페이지 제목 override 정리 (layout 단일 소스로)

**실행:** `cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet`
**전제 상태:** STEP 678로 `layout.tsx` `title.default`를 "Trillion — 전문가 시각의 무료 주식 분석"으로 바꿨으나, **`app/page.tsx`가 자기 `title`을 override**해서 홈 탭·구글 제목이 여전히 옛 "흩어진 금융정보를 한눈에".
**목표:** 홈의 title override 제거 → **layout `title.default`를 단일 소스로** 상속(중복·불일치 제거).
**대상:** `app/page.tsx`.

---

## 변경
`app/page.tsx` 7행:
```tsx
export const metadata = { title: "Trillion — 흩어진 금융정보를 한눈에" };
```
→ **이 줄 삭제.** (홈은 layout `title.default` = "Trillion — 전문가 시각의 무료 주식 분석"을 자동 상속.)
> ⚠️ `metadata`를 다른 곳에서 import해 쓰면 안 됨(홈 전용 title만 있던 export라 삭제 안전). 삭제 후 남는 미사용 import 없으면 그대로.

## 검증 → 커밋
```bash
npx tsc --noEmit
pkill -f "next dev"; rm -rf .next && npm run dev
```
- 홈(`/`) 브라우저 탭 제목이 **"Trillion — 전문가 시각의 무료 주식 분석"** 인지 확인(개발자도구 `<title>` 또는 탭).
- tsc 0. console.log 금지.
```bash
git add app/page.tsx docs/STEP_679_HOME_TITLE_FIX_COMMAND.md
git commit -m "fix(seo): 홈 title override 제거 — layout title.default 단일 소스 상속(전문가 시각·무료 주식 분석)"
git push
```

## 문서 4개 헤더 2026-07-10 + CHANGELOG 한 줄(STEP 679).

## Cowork에게 보고
- 홈 탭 제목 갱신 확인.
