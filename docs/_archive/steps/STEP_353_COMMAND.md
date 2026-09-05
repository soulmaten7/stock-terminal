<!-- 2026-06-22 -->
# STEP 353 — [디자인] 지수 티커 다크화 (헤더와 상단 밴드 통일)

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_353_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
지수 티커(흰 띠)를 **미드나잇(#0E1116)**으로 바꿔 헤더와 이어지는 "상단 밴드"로. 다크 헤더↔흰 티커 사이 붕뜸 해소, 블룸버그·트레이딩뷰 느낌.

> 변경 1파일 3곳: `components/home-v6/HomeIndexStrip.tsx`. 상승(빨강)·하락(파랑) 색은 다크에서도 잘 보여 유지.

---

## 📄 `components/home-v6/HomeIndexStrip.tsx`

### 1 — 래퍼 배경 다크
**찾기:**
```tsx
    <div className="sticky top-0 z-30 flex h-9 items-center border-b border-unjong-border bg-unjong-surface/95 backdrop-blur">
```
**바꾸기:**
```tsx
    <div className="sticky top-0 z-30 flex h-9 items-center border-b border-white/10 bg-[#0E1116]">
```

### 2 — 지수명 라이트
**찾기:**
```tsx
              <span className="text-unjong-muted">{it.name}</span>
```
**바꾸기:**
```tsx
              <span className="text-white/45">{it.name}</span>
```

### 3 — 지수값 라이트
**찾기:**
```tsx
              <span className="font-semibold tabular-nums text-unjong-primary">{it.value}</span>
```
**바꾸기:**
```tsx
              <span className="font-semibold tabular-nums text-white">{it.value}</span>
```

---

## ✅ 검증
```bash
npm run build
```
빌드 무에러.

개발 서버(컴포넌트 → HMR/새로고침):
- 지수 티커 = **미드나잇 밴드**(헤더와 한 덩어리), 지수명 회색·값 흰색·등락 빨강/파랑.

---

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add components/home-v6/HomeIndexStrip.tsx && git commit -m "design(brand): 지수 티커 다크화 — 헤더와 상단 밴드 통일 (STEP 353)" && git push
```

---

> **한 줄 요약**: 지수 티커를 미드나잇으로 — 헤더+티커 상단 다크 밴드 완성(프리미엄 느낌).
