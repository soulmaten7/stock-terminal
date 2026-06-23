<!-- 2026-06-22 -->
# STEP 354 — [모바일] 토대: 강제폭 제거 + 게이트웨이 피드 스택 + 홈 메타

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_354_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
모바일 반응형 1단계(토대):
1. **데스크톱 강제폭 제거** — `body { min-width: 1280px }` 삭제(이게 모바일 가로 스크롤의 주범).
2. **게이트웨이 우측 피드** — 모바일에서 숨김(`hidden lg:block`) → **링크 아래로 스택**.
3. **홈 메타 수정** — 옛 태그라인 덮어쓰기 → `Trillion — 흩어진 금융정보를 한눈에` + 모바일 패딩.

> 변경 3파일: `app/globals.css` · `app/page.tsx` · `components/toolbox/ToolboxClient.tsx`.
> ⚠️ 종목·상품 표는 이미 `overflow-x-auto`(가로 스크롤)라 그대로 OK. 나머지 surface(마이페이지·법정·리딩방)는 다음 패스에서 실제 모바일 화면 보고 정밀 수정.

---

## 📄 1) `app/globals.css` — 강제폭 제거

**찾기:**
```css
  font-family: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  min-width: 1280px;
}
```
**바꾸기:**
```css
  font-family: "Pretendard Variable", "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
}
```

---

## 📄 2) `app/page.tsx` — 홈 메타 + 모바일 패딩 (2곳)

**찾기:**
```tsx
export const metadata = { title: "트릴리언 — 투자상품에 속지 않게 돕는 곳" };
```
**바꾸기:**
```tsx
export const metadata = { title: "Trillion — 흩어진 금융정보를 한눈에" };
```

**찾기:**
```tsx
      <div className="mx-auto max-w-7xl px-6 py-6">
```
**바꾸기:**
```tsx
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
```

---

## 📄 3) `components/toolbox/ToolboxClient.tsx` — 피드 모바일 스택 (2곳)

**찾기:**
```tsx
        ) : FEED_TABS.includes(activeTab) && country === 'KR' ? (
          <div className="flex gap-4">
```
**바꾸기:**
```tsx
        ) : FEED_TABS.includes(activeTab) && country === 'KR' ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:gap-4">
```

**찾기:**
```tsx
            <aside className="hidden w-96 shrink-0 lg:block">
              {feedFor(activeTab)}
            </aside>
```
**바꾸기:**
```tsx
            <aside className="w-full shrink-0 lg:w-96">
              {feedFor(activeTab)}
            </aside>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(CSS·컴포넌트 → HMR/새로고침):
1. 브라우저 창을 좁혀(또는 개발자도구 모바일) 봤을 때 **가로 스크롤 없이** 콘텐츠가 줄어듦.
2. 뉴스·공시·거시 등 탭 → 모바일 폭에선 **피드가 링크 아래로** 내려옴(데스크톱은 우측 그대로).
3. 종목·상품 표는 모바일에서 가로 스크롤.
4. 브라우저 탭 제목 = "Trillion — 흩어진 금융정보를 한눈에".

> 이후 내가 Chrome으로 390px 폭 띄워 스샷 → 깨지는 surface(헤더 넘침·마이페이지·법정 등) 정밀 수정.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add app/globals.css app/page.tsx components/toolbox/ToolboxClient.tsx && git commit -m "feat(mobile): 토대 — 강제폭 제거 + 게이트웨이 피드 모바일 스택 + 홈 메타 (STEP 354)" && git push
```

---

> **한 줄 요약**: 모바일 토대 — `min-width:1280px` 제거 + 피드 모바일 스택 + 홈 메타 수정. 다음: 실제 모바일 화면 보고 surface별 정밀.
