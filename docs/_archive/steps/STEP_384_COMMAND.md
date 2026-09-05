<!-- 2026-06-24 -->
# STEP 384 — 종목 클릭 → 외부보기 시트(A)

> STEP 383 완료 후 실행. **1파일만 수정**(`MarketBoard.tsx`). 빌드 통과 시에만 커밋.
> "(A)" = 외부 링크만 있는 1차 버전. 차트·실시간 데이터는 추후.

## 🔧 실행 (Sonnet)
```bash
cd ~/stock-terminal && claude --dangerously-skip-permissions --model sonnet
```
그다음:
```
@docs/STEP_384_COMMAND.md 파일 내용대로 실행해줘
```

---

## 🎯 목표
종목 행 클릭 → 하단 시트(바텀시트) — **이름·코드·현재가·등락률 + 외부 링크 4개**.
- 모바일·데스크탑 동일하게 바텀시트(하단 고정 패널). "(A)"라 데스크탑 사이드패널은 추후.
- 별 버튼 클릭 시 시트가 열리지 않도록 `stopPropagation`.

변경 1파일: `components/toolbox/MarketBoard.tsx`.

---

## ① 임포트에 ExternalLink, X 추가

**찾기:**
```tsx
import { Star } from 'lucide-react';
```
**바꾸기:**
```tsx
import { ExternalLink, Star, X } from 'lucide-react';
```

---

## ② selectedStock 상태 추가 — watchSet 바로 아래

**찾기:**
```tsx
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
```
**바꾸기:**
```tsx
  const [watchSet, setWatchSet] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<Row | null>(null);
  const [search, setSearch] = useState('');
```

---

## ③ 별 버튼에 stopPropagation 추가 (행 클릭 방지)

**찾기:**
```tsx
                      <button
                        type="button"
                        onClick={() => toggleWatch(r)}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
```
**바꾸기:**
```tsx
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleWatch(r); }}
                        aria-label={watchSet.has(r.symbol) ? '관심종목 해제' : '관심종목 추가'}
```

---

## ④ 행(tr)에 클릭 핸들러 + cursor-pointer 추가

**찾기:**
```tsx
                  <tr key={r.symbol} className="border-b border-unjong-border last:border-0 hover:bg-unjong-background">
```
**바꾸기:**
```tsx
                  <tr key={r.symbol} onClick={() => setSelectedStock(r)} className="cursor-pointer border-b border-unjong-border last:border-0 hover:bg-unjong-background">
```

---

## ⑤ 바텀시트 UI — `</section>` 닫기 바로 위에 삽입

**찾기:**
```tsx
    </section>
  );
}
```
**바꾸기:**
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
    </section>
  );
}
```

---

## ✅ 빌드 검증
```bash
cd ~/stock-terminal && npm run build
```

## ✅ 런타임 확인 포인트
1. 종목 행 클릭 → 바텀시트 뜸(이름·코드·현재가·등락률).
2. 별(⭐) 클릭 → 시트 안 열림(stopPropagation 확인).
3. **네이버 금융** 링크 클릭 → 해당 종목 페이지 열림.
4. DART / TradingView / KIND 링크 정상 동작.
5. 배경(딤) 클릭 → 시트 닫힘.
6. ETF·ETN·리츠 행도 클릭 시 시트 열림(외부 링크 동일).

## 📦 커밋·푸시
```bash
cd ~/stock-terminal && git add -A && git commit -m "feat(market): 종목 클릭 외부보기 바텀시트(A) — 네이버/DART/TradingView/KIND (STEP 384)" && git push
```

---

> **한 줄 요약**: 행 클릭 → 바텀시트(이름·현재가·외부 링크 4개). ⭐ 클릭은 stopPropagation으로 분리. 데스크탑 사이드패널은 (B)에서.
