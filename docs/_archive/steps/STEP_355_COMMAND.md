<!-- 2026-06-22 -->
# STEP 355 — [모바일] 헤더 넘침 해소 + 푸터 패딩

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_355_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
전역 헤더가 작은 폰(≤390px)에서 **로고+네비+아이콘**을 한 줄에 꽉 채워 가로 넘침 발생. 모바일에서만 여백·간격을 줄이고 로고 보조텍스트를 숨겨 해소. 푸터 좌우 패딩도 모바일 축소.

> 변경 2파일: `components/layout/Header.tsx`(2곳) · `components/layout/Footer.tsx`(2곳). 데스크톱(`sm:` 이상)은 기존과 100% 동일.

---

## 📄 1) `components/layout/Header.tsx` — 모바일 간격·여백 축소 (2곳)

**찾기:**
```tsx
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-5 px-6">
```
**바꾸기:**
```tsx
      <div className="mx-auto flex h-[60px] max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6">
```

**찾기:**
```tsx
          <span className="text-sm text-white/45">트릴리언</span>
```
**바꾸기:**
```tsx
          <span className="hidden text-sm text-white/45 sm:inline">트릴리언</span>
```

> 효과: 모바일에선 `Trillion`만 노출(보조 `트릴리언` 숨김) + 간격 gap-3·여백 px-4 → 한 줄 여유 확보. sm(640px)↑은 그대로.

---

## 📄 2) `components/layout/Footer.tsx` — 모바일 패딩 축소 (2곳)

**찾기:**
```tsx
      <div className="mx-auto max-w-7xl px-6 py-12">
```
**바꾸기:**
```tsx
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
```

**찾기:**
```tsx
        <div className="mx-auto max-w-7xl px-6 py-6">
```
**바꾸기:**
```tsx
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
```

> 푸터 그리드는 이미 `grid-cols-2`(모바일 2열)라 OK — 패딩만 모바일 여유.

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → HMR/새로고침):
1. 폰(또는 브라우저 좁힘)에서 **헤더 한 줄에 가로 스크롤·넘침 없음**.
2. 모바일 헤더 로고 = `Trillion`만(보조 `트릴리언` 숨김), 데스크톱은 `Trillion 트릴리언` 그대로.
3. 푸터 좌우 여백 모바일에서 살짝 좁아짐, 데스크톱 동일.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/layout/Header.tsx components/layout/Footer.tsx && git commit -m "feat(mobile): 헤더 작은폰 넘침 해소(간격·여백·보조텍스트) + 푸터 패딩 (STEP 355)" && git push
```

---

> **한 줄 요약**: 모바일 헤더 한 줄 넘침 해소(gap·padding 축소 + 보조텍스트 숨김) + 푸터 패딩. 다음: 네 폰 스샷으로 페이지별 surface(마이페이지·리딩방·즐겨찾기·법정) 검증.
