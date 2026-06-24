<!-- 2026-06-24 -->
# STEP 385 — 종목 클릭 시트: 증권사 바로가기 리스트 + 모바일 전용

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_385_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
STEP 384가 종목 클릭 시트를 ① **전 화면**에 띄우고 ② 내용을 **네이버/DART/TradingView/KIND**(정보 링크)로 넣었는데, 사용자 의도는:
- 모바일은 증권사 바로가기가 표 아래라 **한눈에 안 보임** → 종목 클릭 시 시트에 **증권사 바로가기 리스트**(키움·미래에셋… = PC 우측/모바일 하단의 그 리스트)를 띄우기.
- 시트는 **모바일 전용**(PC는 우측에 증권사 리스트가 이미 한눈에 보임 → 시트 불필요).

→ 시트를 `lg:hidden`(모바일 전용)으로, 내용을 `<BrokerRanking />`(증권사 바로가기)로 교체. 정보 링크 4개·가격 블록 제거(헤더에 종목명·가격만 간단히).

변경 1파일: `components/toolbox/MarketBoard.tsx` (import + 시트 블록). `BrokerRanking`은 이미 import돼 있음.

---

## ① import — ExternalLink 제거 (시트에서 더 이상 안 씀)
**찾기:**
```tsx
import { ExternalLink, Star, X } from 'lucide-react';
```
**바꾸기:**
```tsx
import { Star, X } from 'lucide-react';
```

## ② 시트 블록 전체 교체 — 모바일 전용 + 증권사 바로가기

**찾기:**
```tsx
      {/* 종목 외부보기 바텀시트 */}
      {selectedStock && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedStock(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4 shadow-xl sm:p-5">
            {/* 헤더 */}
            <div className="mb-3 flex items-center gap-3">
              <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-unjong-primary">{selectedStock.name}</p>
                <p className="font-mono text-xs text-unjong-muted">{selectedStock.symbol}</p>
              </div>
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            {/* 가격 */}
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-unjong-primary">
                {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
              </span>
              <span className={`text-sm font-semibold tabular-nums ${pctColor(selectedStock.changePercent)}`}>
                {pct(selectedStock.changePercent)}
              </span>
              <span className="text-xs text-unjong-muted">KRX · 전일 종가</span>
            </div>
            {/* 외부 링크 2×2 그리드 */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '네이버 금융', href: `https://finance.naver.com/item/main.naver?code=${selectedStock.symbol}` },
                { label: 'DART 공시', href: `https://dart.fss.or.kr/dsab007/search.ax?textCrpNm=${encodeURIComponent(selectedStock.name)}` },
                { label: 'TradingView', href: `https://www.tradingview.com/chart/?symbol=KRX:${selectedStock.symbol}` },
                { label: 'KRX KIND', href: `https://kind.krx.co.kr/corpgeneral/corpsearch.do?method=loadInitPage&searchCodeType=&searchCorpName=${encodeURIComponent(selectedStock.name)}` },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center justify-between rounded-xl border border-unjong-border px-3 py-2.5 text-sm font-medium text-unjong-primary transition-colors hover:bg-unjong-background hover:text-unjong-accent"
                >
                  {link.label}
                  <ExternalLink size={12} className="shrink-0 text-unjong-muted" />
                </a>
              ))}
            </div>
          </div>
        </>
      )}
```
**바꾸기:**
```tsx
      {/* 종목 클릭 → 증권사 바로가기 (모바일 전용 — PC는 우측 리스트로 한눈에 보임) */}
      {selectedStock && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setSelectedStock(null)} />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-unjong-border bg-unjong-surface p-4 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <StockLogo code={selectedStock.symbol} name={selectedStock.name} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-unjong-primary">{selectedStock.name}</p>
                <p className="font-mono text-xs text-unjong-muted">
                  {selectedStock.symbol} · {selectedStock.price ? selectedStock.price.toLocaleString() : '—'}
                  <span className={`ml-1 font-sans font-semibold ${pctColor(selectedStock.changePercent)}`}>{pct(selectedStock.changePercent)}</span>
                </p>
              </div>
              <button type="button" onClick={() => setSelectedStock(null)} aria-label="닫기" className="shrink-0 text-unjong-muted hover:text-unjong-primary">
                <X size={20} />
              </button>
            </div>
            <p className="mb-1 text-sm font-bold text-unjong-primary">증권사 바로가기</p>
            <BrokerRanking hideHeader />
          </div>
        </div>
      )}
```

---

## ✅ 빌드 검증 (필수)
```bash
cd ~/stock-terminal && npm run build
```
- ✅ 무에러 → 커밋. (ExternalLink 제거했으니 미사용 import 에러 없는지 확인.)
- ❌ 에러 → 메시지 출력 후 멈춤.

## ✅ 런타임 (컴포넌트만 → 새로고침)
- **모바일(폰/좁은 창)**: 종목 클릭 → 하단 시트에 종목명·가격 + **증권사 바로가기 리스트**(키움·미래에셋…) 표시, 각 증권사 누르면 새 탭.
- **데스크탑(≥1024)**: 종목 클릭해도 **시트 안 뜸**(우측에 증권사 리스트 이미 보임).

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "fix(market): 종목 클릭 시트 → 증권사 바로가기 리스트 + 모바일 전용 (STEP 385)" && git push
```

---

> **한 줄 요약**: 종목 클릭 시트 = 정보링크 → **증권사 바로가기 리스트(BrokerRanking)**, `lg:hidden`으로 **모바일 전용**. PC는 우측 리스트 그대로.
