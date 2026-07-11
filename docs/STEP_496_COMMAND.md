<!-- 2026-07-01 -->
# STEP 496 — 한국 보드 모바일 수익률 텍스트 크기 통일 (다른 국가와 동일 13px)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_496_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
모바일에서 🇰🇷 한국 종목보드의 수익률 텍스트만 크게 나옴(크기 지정 누락 → 기본 ≈16px). US·JP·CN은 `text-[13px]`. → 한국도 `text-[13px]`로 맞춤. **1파일 1줄.** 클라이언트 컴포넌트라 HMR 즉시 반영.

## 1) `components/toolbox/MarketBoard.tsx`
**찾을 것:**
```tsx
                        <span className={`shrink-0 tabular-nums font-semibold ${pctColor(r[mobileField] as number | null | undefined)}`}>
```
**바꿀 것:**
```tsx
                        <span className={`shrink-0 text-[13px] tabular-nums font-semibold ${pctColor(r[mobileField] as number | null | undefined)}`}>
```

## 2) 빌드
```bash
npm run build
```

## 3) 검증 (localhost:3333, 모바일 폭)
- [ ] 🇰🇷 한국 종목보드 모바일 카드의 수익률 크기가 🇺🇸🇯🇵🇨🇳와 동일(13px).
- [ ] 종목명·현재가 등 나머지는 변화 없음.

## 4) 커밋
```bash
git add components/toolbox/MarketBoard.tsx && git commit -m "fix(kr): 모바일 종목보드 수익률 텍스트 크기 통일(13px, 타 국가와 동일) (STEP 496)" && git push
```
