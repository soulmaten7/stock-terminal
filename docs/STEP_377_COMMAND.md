<!-- 2026-06-24 -->
# STEP 377 — [모바일 ①] 토대: 페이지 패딩·푸터·게이트웨이

> 📱 마스터 플랜 `docs/MOBILE_BUILD_PLAN.md` 참고. **원칙: 데스크탑 클래스 삭제 금지, 반응형 변형만 추가.** 빌드 통과 시에만 커밋.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_377_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
모바일 좌우 여백 통일(`px-4 sm:px-6`) + 푸터 모바일 간격 축소 + 게이트웨이 내부 패딩/탭 줄 모바일 여유. 데스크탑(≥640) 외형 불변.

---

## ① 페이지 패딩 — 6개 파일 (각 파일에서 1곳)

**`app/favorites/page.tsx`** 찾기:
```tsx
    <main className="mx-auto max-w-7xl px-6 py-6">
```
바꾸기:
```tsx
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
```

**`app/admin/page.tsx`** 찾기:
```tsx
    <div className="mx-auto max-w-7xl px-6 py-8">
```
바꾸기:
```tsx
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
```

**`app/about/page.tsx`** 찾기:
```tsx
    <div className="mx-auto max-w-7xl px-6 py-12">
```
바꾸기:
```tsx
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
```

**`app/terms/page.tsx`** 찾기:
```tsx
    <div className="mx-auto max-w-7xl px-6 py-12">
```
바꾸기:
```tsx
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
```

**`app/privacy/page.tsx`** 찾기:
```tsx
    <div className="mx-auto max-w-7xl px-6 py-12">
```
바꾸기:
```tsx
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
```

**`app/coin/page.tsx`** 찾기:
```tsx
    <div className="mx-auto max-w-7xl px-6 py-20 text-center">
```
바꾸기:
```tsx
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
```

> 마이페이지(`app/mypage/page.tsx`)는 이미 `px-4 sm:px-6`이라 건드리지 않음.

## ② 푸터 모바일 간격 — `components/layout/Footer.tsx`
찾기:
```tsx
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
```
바꾸기:
```tsx
        <div className="grid grid-cols-2 gap-4 sm:gap-8 md:grid-cols-4">
```

## ③ 게이트웨이 — `components/toolbox/ToolboxClient.tsx`

카테고리 탭 줄 — 찾기:
```tsx
      <div className="flex gap-1 overflow-x-auto border-b border-unjong-border px-3 py-2">
```
바꾸기:
```tsx
      <div className="flex gap-1 overflow-x-auto border-b border-unjong-border px-2 py-2 sm:px-3">
```

내용 패딩 — 찾기:
```tsx
      {/* 내용 */}
      <div className="p-4">
```
바꾸기:
```tsx
      {/* 내용 */}
      <div className="p-3 sm:p-4">
```

---

## ✅ 빌드 + 커밋
```bash
cd ~/stock-terminal && npm run build
```
무에러 시:
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(mobile): 페이지 패딩 px-4 sm:px-6 통일 + 푸터 간격 + 게이트웨이 패딩 (STEP 377)" && git push
```
> 빌드 실패 시 커밋하지 말고 에러 출력 후 멈춤. **다음 STEP(378)로 넘어가도 됨** — 단 실패 메시지는 남겨둘 것.

---

> **한 줄 요약**: 모바일 좌우 여백·푸터·게이트웨이 토대. 데스크탑 불변(전부 `sm:`로 복원).
