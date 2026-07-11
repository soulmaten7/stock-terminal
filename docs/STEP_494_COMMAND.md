<!-- 2026-07-01 -->
# STEP 494 — 일본·중국 종목보드 종목명 먼저 표시 (숫자코드 → 이름 우선, 한국 방식)

## ▶ 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
```
@docs/STEP_494_COMMAND.md 파일 내용대로 실행해줘
```

## 🎯 목표
일본·중국 보드가 미국 복제라 **숫자 티커(2513·0700·600519)가 먼저 굵게** 나옴 → 한국처럼 **종목명 먼저(굵게) + 코드는 옆에 작게**로 뒤집기. 미국은 알파벳 티커라 그대로 둠.
- 대상: `components/toolbox/JpMarketBoard.tsx`, `components/toolbox/CnMarketBoard.tsx` — 각 3곳(PC 표 행 / 모바일 카드 / 상세 시트).
- 클라이언트 컴포넌트라 **HMR로 즉시 반영**(dev 재시작 불필요). 빌드·커밋만.

---

## 1) `components/toolbox/JpMarketBoard.tsx` (3곳)

**1-A. PC 표 행.** 찾을 것:
```tsx
                        <span className="min-w-0 truncate">
                          <span className="font-bold text-unjong-primary">{r.symbol.replace(/\.T$/, '')}</span>
                          <span title={r.name} className="ml-1.5 text-xs text-unjong-muted">{r.name}</span>
                        </span>
```
**바꿀 것:**
```tsx
                        <span className="min-w-0 truncate">
                          <span title={r.name} className="font-bold text-unjong-primary">{r.name}</span>
                          <span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.T$/, '')}</span>
                        </span>
```

**1-B. 모바일 카드.** 찾을 것:
```tsx
                      <p className="truncate text-[15px] leading-tight text-unjong-primary"><span className="font-bold">{r.symbol.replace(/\.T$/, '')}</span><span className="ml-1.5 text-xs text-unjong-muted">{r.name}</span></p>
```
**바꿀 것:**
```tsx
                      <p className="truncate text-[15px] leading-tight text-unjong-primary"><span className="font-bold">{r.name}</span><span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.T$/, '')}</span></p>
```

**1-C. 상세 시트 헤더.** 찾을 것:
```tsx
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol.replace(/\.T$/, '')}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.name} · {selectedStock.price ? formatPrice(selectedStock.price, 'JP') : '—'}
```
**바꿀 것:**
```tsx
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol.replace(/\.T$/, '')} · {selectedStock.price ? formatPrice(selectedStock.price, 'JP') : '—'}
```

---

## 2) `components/toolbox/CnMarketBoard.tsx` (3곳)

**2-A. PC 표 행.** 찾을 것:
```tsx
                        <span className="min-w-0 truncate">
                          <span className="font-bold text-unjong-primary">{r.symbol.replace(/\.(HK|SS|SZ)$/, '')}</span>
                          <span title={r.name} className="ml-1.5 text-xs text-unjong-muted">{r.name}</span>
                        </span>
```
**바꿀 것:**
```tsx
                        <span className="min-w-0 truncate">
                          <span title={r.name} className="font-bold text-unjong-primary">{r.name}</span>
                          <span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.(HK|SS|SZ)$/, '')}</span>
                        </span>
```

**2-B. 모바일 카드.** 찾을 것:
```tsx
                      <p className="truncate text-[15px] leading-tight text-unjong-primary"><span className="font-bold">{r.symbol.replace(/\.(HK|SS|SZ)$/, '')}</span><span className="ml-1.5 text-xs text-unjong-muted">{r.name}</span></p>
```
**바꿀 것:**
```tsx
                      <p className="truncate text-[15px] leading-tight text-unjong-primary"><span className="font-bold">{r.name}</span><span className="ml-1.5 text-xs text-unjong-muted">{r.symbol.replace(/\.(HK|SS|SZ)$/, '')}</span></p>
```

**2-C. 상세 시트 헤더.** 찾을 것:
```tsx
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.symbol.replace(/\.(HK|SS|SZ)$/, '')}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.name} · {selectedStock.price ? formatPrice(selectedStock.price, curCode) : '—'}
```
**바꿀 것:**
```tsx
                  <p className="font-bold leading-snug text-unjong-primary">{selectedStock.name}</p>
                  <p className="font-mono text-xs text-unjong-muted">
                    {selectedStock.symbol.replace(/\.(HK|SS|SZ)$/, '')} · {selectedStock.price ? formatPrice(selectedStock.price, curCode) : '—'}
```

---

## 3) 빌드 확인
```bash
npm run build
```
> 클라이언트 컴포넌트라 실행 중 dev면 HMR로 이미 반영됨. 재시작 불필요.

## 4) 검증 (localhost:3333)
- [ ] 🇯🇵 일본 / 🇨🇳 중국 종목·상품: 각 행에 **종목명이 굵게 먼저**, 숫자코드는 옆에 작게 회색.
- [ ] 모바일 카드·상세 시트도 동일하게 이름 먼저.
- [ ] 🇰🇷 한국(이름 먼저)·🇺🇸 미국(티커 먼저)는 변화 없음.
- [ ] 검색은 이름·티커 둘 다 여전히 동작.

## 5) 커밋
```bash
git add components/toolbox/JpMarketBoard.tsx components/toolbox/CnMarketBoard.tsx && git commit -m "fix(jp,cn): 종목보드 종목명 우선 표시(숫자코드→이름, 한국 방식) (STEP 494)" && git push
```

## ⚠️ 노트
- 미국은 알파벳 티커(AAPL)가 식별자라 티커 먼저 유지(변경 없음).
- 이름이 길면 truncate로 코드가 잘릴 수 있음 — 이름 우선이라 의도된 동작.
