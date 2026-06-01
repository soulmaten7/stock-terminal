<!-- 2026-06-01 -->
# STEP 130 — 카드 9개 안 콘텐츠 토스 스타일 (디테일)

## 실행 명령어
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model opus
```

## 전제 상태
- STEP 129 완료 (CardContainer 토스 스타일 적용)
- 9개 정확 카드 (ScalperCards · UsCards) 의 내부 콘텐츠는 아직 작은 텍스트·좁은 padding

## 목표

| 영역 | 변경 |
|------|------|
| **카드 안 종목 행** | py-1.5 → py-3 (여유) · text-xs → text-sm |
| **종목명** | font-medium → font-semibold + truncate |
| **가격·등락률** | 진한 색상 (red-500·green-500 토스) + tabular-nums |
| **종목 코드** | font-mono · 작은 회색 |
| **카드 내부 spacing** | space-y-1 → space-y-2 |
| **순위 표시** | 큰 숫자 + 흐린 색 (1, 2, 3 강조) |
| **카드 footer 안내** | 더 차분하게 |

## 작업 (4개 카드 컴포넌트 패턴 일괄 적용)

### 적용 대상 카드 9개
- **ScalperCards.tsx**: MoversCard · VolumeCard · NetBuyBrokerCard · DisclosureCard
- **LongtermCards.tsx**: DisclosuresFilterCard
- **UsCards.tsx**: IndicesCard · M7Card · UsMoversCard · ForexClockCard

### 통일 패턴 — 종목 행 (Movers·Volume·M7 등)

기존:
```tsx
<li
  onClick={...}
  className="flex items-center justify-between gap-2 py-1.5 px-2 text-xs hover:bg-unjong-background rounded cursor-pointer"
>
  <div className="flex items-center gap-2">
    <span className="text-unjong-muted">{rank}</span>
    <div>
      <p className="font-medium text-unjong-primary">{name}</p>
      <p className="text-[10px] text-unjong-muted">{code}</p>
    </div>
  </div>
  <div className="text-right">
    <p className="font-semibold text-unjong-primary tabular-nums">{price}</p>
    <p className={`text-xs ${isUp ? "text-unjong-success" : "text-unjong-danger"}`}>
      {isUp ? "+" : ""}{changePct}%
    </p>
  </div>
</li>
```

변경:
```tsx
<li
  onClick={...}
  className="flex items-center justify-between gap-3 py-3 px-3 hover:bg-unjong-background rounded-lg cursor-pointer transition-colors"
>
  <div className="flex items-center gap-3 min-w-0">
    <span className="text-base font-bold text-unjong-muted w-5 flex-shrink-0 text-center tabular-nums">
      {rank}
    </span>
    <div className="min-w-0">
      <p className="text-sm font-semibold text-unjong-primary truncate">{name}</p>
      <p className="text-xs text-unjong-muted font-mono">{code}</p>
    </div>
  </div>
  <div className="text-right flex-shrink-0">
    <p className="text-sm font-semibold text-unjong-primary tabular-nums">{price}</p>
    <p className={`text-xs font-semibold tabular-nums ${isUp ? "text-[#1AC267]" : "text-[#F04452]"}`}>
      {isUp ? "+" : ""}{changePct}%
    </p>
  </div>
</li>
```

### 색상 — 토스 강조 등락

기존 `text-unjong-success` → `text-[#1AC267]` (토스 그린)
기존 `text-unjong-danger` → `text-[#F04452]` (토스 레드)

또는 globals.css 의 `--color-toss-red/green` 활용:
```tsx
className="text-toss-red"
```

### NetBuyBrokerCard — 외인/기관 행

토스 스타일 적용:
```tsx
<li className="py-3 px-3 hover:bg-unjong-background rounded-lg cursor-pointer transition-colors">
  <div className="flex items-center justify-between mb-1.5">
    <span className="text-sm font-semibold text-unjong-primary">{name}</span>
    <span className="text-xs text-unjong-muted font-mono">{code}</span>
  </div>
  <div className="flex items-center gap-4 text-xs">
    <span>
      외인 <span className="font-semibold text-[#F04452]">{foreign > 0 ? "+" : ""}{foreign}억</span>
    </span>
    <span>
      기관 <span className="font-semibold text-[#1AC267]">{inst > 0 ? "+" : ""}{inst}억</span>
    </span>
  </div>
</li>
```

### IndicesCard — 미국 지수

지수별 큰 카드:
```tsx
<div className="grid grid-cols-2 gap-3">
  {indices.map((idx) => (
    <div className="p-3 rounded-lg bg-unjong-background hover:bg-white transition-colors">
      <p className="text-xs text-unjong-muted">{idx.name}</p>
      <p className="text-lg font-bold text-unjong-primary tabular-nums mt-1">{idx.value}</p>
      <p className={`text-xs font-semibold ${idx.up ? "text-[#1AC267]" : "text-[#F04452]"}`}>
        {idx.up ? "+" : ""}{idx.changePct}%
      </p>
    </div>
  ))}
</div>
```

### 빌드 검증

```bash
npm run build 2>&1 | tail -15
```

### 커밋 + 푸시

```bash
git add -A
git commit -m "feat(design): 카드 9개 콘텐츠 토스 스타일 (전면 리뉴얼 STEP 2/5)

- 종목 행: py-1.5 → py-3 (여유 spacing)
- 텍스트: text-xs → text-sm (가독성)
- 종목명: font-medium → font-semibold + truncate
- 순위: 큰 숫자 + bold (1, 2, 3 시각 강조)
- 등락 색상: unjong-success/danger → 토스 #1AC267/#F04452 (선명)
- 호버: rounded-lg + transition-colors
- 종목 코드: font-mono (시각 구분)

영향: 9개 카드 (Movers·Volume·NetBuy·공시 한국 + Indices·M7·UsMovers·시계 미국)

다음 STEP 131: 종목 페이지 네이버 탭 시스템 (차트·토론·뉴스·인사이트)"
git push
```
